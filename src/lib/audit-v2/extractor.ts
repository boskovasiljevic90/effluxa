import OpenAI, { toFile } from "openai";
import { extractedFinancialDataSchema, invoiceLedgerTransactionSchema } from "./schema";
import { normalizeExtractedData } from "./normalizer";
import type { ExtractedFinancialData } from "./types";

// Read deployment configuration through a dynamic key. Next.js can inline
// direct process.env.NAME references during a Vercel build when a local .env
// file is present; dynamic lookup keeps production runtime values authoritative.
function runtimeEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const EXTRACTION_MODEL = IS_PRODUCTION
  ? "gpt-4.1-mini"
  : runtimeEnv("EFFLUXA_AUDIT_V2_MODEL", "gpt-4.1-mini");

const EXTRACTION_PASSES = [
  {
    name: "invoice-ledger",
    collections: "apInvoices",
    instructions: "Read every row from all accounts-payable invoice ledgers. Preserve repeated invoice numbers as separate records, including exact invoice date and paid date. Do not summarize the ledger and do not extract payment rows in this pass.",
  },
  {
    name: "payments-and-controls",
    collections: "payments, vendorMasterChanges, priceRecords, policies",
    instructions: "Read every row from all payment schedules and bank-payment tables. Preserve repeated invoice numbers as separate records. Also capture every vendor-master change, old/new values, historical unit prices, and purchase-approval, split-invoice, vendor-callback, weekend-payment, travel, card, overtime, inventory, and FX policies.",
  },
  {
    name: "working-capital-and-kpis",
    collections: "arAging, unappliedItems, apAging, customerMetrics, financialMetrics",
    instructions: "Read every customer row in AR aging, every unapplied credit/receipt row, every AP aging bucket and vendor-concentration row, and every customer concentration row. Capture the full KPI and budget-versus-actual history, including gross margin, EBITDA margin, revenue, leverage, DSO, DPO, inventory days, software cost, expense ratios, and category-level comparisons for professional services, software, and travel/entertainment.",
  },
  {
    name: "opex-people-and-assets",
    collections: "softwareLicenses, expenses, overtime, overtimeTrends, inventory, financialMetrics",
    instructions: "Read every software and recurring-service row, including active users, licensed seats, monthly and annualized cost, renewals, legacy-system labels, and purpose. Read every travel and employee expense claim. Read all employee overtime rows and the complete monthly overtime trend, plus any department-level YTD overtime totals. Read every inventory SKU with quantity, unit cost, book value, aging, movement date, provision, negative balances, and write-off metrics. In financialMetrics, include only inventory write-off/count-adjustment and department-level overtime metrics if present.",
  },
  {
    name: "financing-and-related-parties",
    collections: "debtFacilities, financialCostItems, relatedPartyTransactions, fxCommitments, notes",
    instructions: "Read every debt facility and covenant row, every financing/late-payment/tax/FX cost item, all related-party balances and transactions with prior/current amounts and terms, every foreign-currency purchase commitment and hedge status, and the management notes that explain timing, ERP transition, collection, inventory, liquidity, or commitment context.",
  },
];

const baseCollections = ["companyName", "currency", "reportingPeriods", "sourceFile", "notes"];

export type AuditExtractionPassName = (typeof EXTRACTION_PASSES)[number]["name"];

export type AuditExtractionOptions = {
  concurrency?: number;
  model?: string;
  maxInputChars?: number;
  serviceTier?: string;
  skipPasses?: AuditExtractionPassName[];
  seedData?: Partial<ExtractedFinancialData>;
  routeText?: (passName: AuditExtractionPassName, fullText: string) => string | undefined;
};

function schemaForPass(collectionList: string, passName: string) {
  const sourceSchema = extractedFinancialDataSchema as unknown as { properties: Record<string, unknown>; required: string[] };
  const allowed = new Set([...baseCollections, ...collectionList.split(", ")]);
  const properties = Object.fromEntries(Object.entries(sourceSchema.properties).filter(([key]) => allowed.has(key)));
  if (passName === "invoice-ledger") {
    properties.apInvoices = { type: "array", items: invoiceLedgerTransactionSchema };
  }
  return {
    ...sourceSchema,
    properties,
    required: sourceSchema.required.filter((key) => allowed.has(key)),
  };
}

const EXTRACTION_MAX_OUTPUT_TOKENS = IS_PRODUCTION
  ? 12000
  : Number(runtimeEnv("EFFLUXA_AUDIT_V2_MAX_OUTPUT_TOKENS", "12000"));
const TRANSACTION_EXTRACTION_MAX_OUTPUT_TOKENS = IS_PRODUCTION
  ? 16000
  : Number(runtimeEnv("EFFLUXA_AUDIT_V2_TRANSACTION_MAX_OUTPUT_TOKENS", "16000"));
const EXTRACTION_CONCURRENCY = IS_PRODUCTION
  ? 2
  : Math.max(1, Number(runtimeEnv("EFFLUXA_AUDIT_V2_CONCURRENCY", "1")));
function extractResponseText(response: unknown) {
  const candidate = response as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  if (typeof candidate.output_text === "string" && candidate.output_text.trim()) return candidate.output_text;

  return (candidate.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .filter(Boolean)
    .join("\n");
}

function parseStructuredOutput(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  if (!cleaned) throw new Error("Audit V2 extractor returned empty output.");

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Audit V2 extractor returned invalid JSON.");

    try {
      return JSON.parse(cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"));
    } catch {
      throw new Error("Audit V2 extractor returned invalid JSON.");
    }
  }
}

function responseDiagnostic(response: unknown, outputText: string) {
  const candidate = response as {
    status?: unknown;
    incomplete_details?: unknown;
    output?: unknown;
  };
  return [
    `status=${typeof candidate.status === "string" ? candidate.status : "unknown"}`,
    `outputChars=${outputText.length}`,
    `outputItems=${Array.isArray(candidate.output) ? candidate.output.length : 0}`,
    candidate.incomplete_details ? `incomplete=${JSON.stringify(candidate.incomplete_details)}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

export async function extractFinancialData({
  file,
  financialText,
  fileName,
  language = "English",
  options,
}: {
  file: File;
  financialText?: string;
  fileName: string;
  language?: string;
  options?: AuditExtractionOptions;
}): Promise<ExtractedFinancialData> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: Number(process.env.EFFLUXA_AUDIT_V2_REQUEST_TIMEOUT_MS || "300000"),
    maxRetries: Number(process.env.EFFLUXA_AUDIT_V2_MAX_RETRIES || "0"),
  });
  const extractionModel = options?.model || EXTRACTION_MODEL;
  const passInputMaxChars = options?.maxInputChars || 80000;
  const isPdf = file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  let uploadedFileId: string | null = null;

  if (isPdf && !financialText?.trim()) {
    const uploaded = await openai.files.create({
      file: await toFile(Buffer.from(await file.arrayBuffer()), fileName),
      purpose: "user_data",
    });
    uploadedFileId = uploaded.id;
  }

  const runPass = async (
    pass: (typeof EXTRACTION_PASSES)[number],
    passText: string | undefined
  ) => {
    const passStartedAt = Date.now();
    if (process.env.EFFLUXA_AUDIT_V2_DEBUG === "true") {
      console.info(
        `[Effluxa V2] pass started: ${pass.name}`
      );
    }
    const content: Array<Record<string, unknown>> = [];
    if (uploadedFileId) {
      content.push({
        type: "input_file",
        file_id: uploadedFileId,
      });
    }

    const routedPassText = options?.routeText?.(pass.name, passText || "") ?? passText;

    content.push({
      type: "input_text",
      text: `
You are the extraction layer of Effluxa Audit Engine V2.

Read the uploaded financial document and return only the structured JSON object required by the schema.
Your task is transcription and normalization, not auditing. Never write conclusions such as fraud, suspicious, wasteful, duplicate, risky, or savings opportunity into the extracted data.

This is extraction pass "${pass.name}". Populate only these collections in detail: ${pass.collections}. Return empty arrays for collections outside this pass, except for companyName, currency, reportingPeriods, sourceFile, and notes when directly supported.
Pass-specific instructions: ${pass.instructions}

Rules:
- Extract only information that is visible in the source document.
- Never invent vendors, invoices, dates, amounts, policies, pages, rows, or relationships.
- Use empty strings for unknown text and null for unknown numbers, dates, booleans, pages, rows, and sheets.
- Amounts must be plain positive or negative numbers without currency symbols. Preserve the sign for inventory quantities, but keep invoice and payment amounts non-negative.
- Dates should be ISO YYYY-MM-DD when the source gives enough information; otherwise null.
- Use the source page for PDFs, and row/sheet for spreadsheets when visible.
- Copy the source wording into notes when context is relevant but does not fit another field.
- Do not summarize or score the document.
- Respond in ${language} only where textual source values need translation; preserve names, invoice numbers, and identifiers.

Completeness is more important than brevity in this pass. Do not stop after the first page or after a representative sample. If the same invoice number appears twice, return two objects. If a table continues across pages, continue reading until its end.

The following structured collections are especially important when present: accounts payable invoices, bank payments, vendor master changes, receivables aging, software licenses, overtime, inventory, debt facilities, policies, historical price records, employee expense claims, customer credits and unapplied cash, financial KPIs and budget-versus-actual metrics, financing/leakage costs, overtime trends, related-party balances, foreign-currency commitments, accounts-payable aging, and customer concentration metrics.

Completeness requirements:
- For transaction-level ledgers, extract every visible row rather than a representative sample. Preserve repeated invoice numbers and near-identical invoice references as separate records, including invoice date and paid date.
- For tables with a total row, extract the detailed rows and the total only when it is useful as a metric; do not replace row-level detail with a summary.
- For receivables, capture each customer, all aging buckets, total balance, credit limit, and any specific allowance. For payables, capture aging buckets, total AP, and vendor concentration rows.
- For software and recurring services, capture every service, licensed seats, active users, monthly cost, annualized cost, renewal, purpose, and whether the service is a legacy system.
- For expenses, capture every visible claim with employee, date, merchant/item, category, amount, receipt, business purpose, hotel nights, approval state, and folio/reference.
- For financial metrics, retain the metric name, period, actual, budget/target, variance, and unit exactly enough to distinguish percentages, percentage points, days, multiples, and currency.
- For vendor changes and related-party tables, preserve old/new values, relationships, approvals, terms, and open balances. For FX commitments, preserve currency, foreign amount, EUR equivalent, due date, hedge status, and policy threshold when present.
- Put source page numbers on every extracted row when the source is a PDF. Do not omit a row merely because its page is dense or its amount is repeated.

${routedPassText ? `Spreadsheet/text input:\n${routedPassText.slice(0, passInputMaxChars)}` : "Use the attached file as the source of truth."}
`,
    });

    const baseMaxTokens =
      pass.name === "invoice-ledger"
        ? TRANSACTION_EXTRACTION_MAX_OUTPUT_TOKENS
        : EXTRACTION_MAX_OUTPUT_TOKENS;

    const requestPass = async (maxOutputTokens: number) =>
      (await openai.responses.create({
        model: extractionModel,
        input: [{ role: "user", content }],
        max_output_tokens: maxOutputTokens,
        // GPT-5 family models do not accept the legacy temperature control;
        // their default extraction behavior is deterministic enough for the
        // strict schema and downstream rules to validate.
        ...(!extractionModel.startsWith("gpt-5") ? { temperature: 0 } : {}),
        text: {
          format: {
            type: "json_schema",
            name: `effluxa_financial_extraction_${pass.name.replace(/[^a-z0-9]/gi, "_")}`,
            strict: true,
            schema: schemaForPass(pass.collections, pass.name),
          },
        },
        ...(options?.serviceTier ? { service_tier: options.serviceTier } : {}),
      } as unknown as Parameters<typeof openai.responses.create>[0])) as unknown;

    let response = await requestPass(baseMaxTokens);
    let outputText = extractResponseText(response);

    const incompleteReason = (response as { incomplete_details?: { reason?: string } })
      ?.incomplete_details?.reason;

    if (!outputText.trim() || incompleteReason === "max_output_tokens") {
      // A truncated structured response used to abort the whole audit and hand
      // the customer an empty fallback report. Retry the pass once with a
      // larger output budget before giving up.
      response = await requestPass(Math.round(baseMaxTokens * 1.75));
      outputText = extractResponseText(response);
    }
    try {
      const normalized = normalizeExtractedData(parseStructuredOutput(outputText), fileName);
      if (process.env.EFFLUXA_AUDIT_V2_DEBUG === "true") {
        console.info(`[Effluxa V2] pass completed: ${pass.name} (${Date.now() - passStartedAt}ms)`, {
          apInvoices: normalized.apInvoices.length,
          payments: normalized.payments.length,
          records: Object.values(normalized).filter(Array.isArray).reduce((count, value) => count + value.length, 0),
          inputChars: routedPassText?.length || 0,
        });
      }
      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audit V2 extractor returned invalid JSON.";
      throw new Error(`${message} (${responseDiagnostic(response, outputText)}; pass=${pass.name})`);
    }
  };

  const requestedPass = process.env.EFFLUXA_AUDIT_V2_ONLY_PASS;
  const passesToRun = requestedPass
    ? EXTRACTION_PASSES.filter((pass) => pass.name === requestedPass)
    : EXTRACTION_PASSES.filter((pass) => !options?.skipPasses?.includes(pass.name));
  if (passesToRun.length === 0 && !options?.seedData) {
    throw new Error(`Unknown Audit V2 extraction pass: ${requestedPass}`);
  }

  const extractionJobs = passesToRun.map((pass) => ({ pass, passText: financialText }));

  const passResults = new Array<ExtractedFinancialData>(extractionJobs.length);
  let nextPassIndex = 0;
  const extractionConcurrency = Math.max(
    1,
    Math.min(extractionJobs.length, Math.floor(options?.concurrency || EXTRACTION_CONCURRENCY))
  );
  try {
    await Promise.all(
      Array.from({ length: extractionConcurrency }, async () => {
        while (true) {
          const passIndex = nextPassIndex++;
          if (passIndex >= extractionJobs.length) return;
          const job = extractionJobs[passIndex];
          passResults[passIndex] = await runPass(job.pass, job.passText);
        }
      })
    );
  } catch (error) {
    if (uploadedFileId) {
      await openai.files.delete(uploadedFileId).catch(() => undefined);
    }
    throw error;
  }

  const arrayFields = [
    "apInvoices", "payments", "vendorMasterChanges", "priceRecords", "arAging", "softwareLicenses", "overtime", "inventory", "debtFacilities",
    "expenses", "unappliedItems", "financialMetrics", "financialCostItems", "overtimeTrends", "relatedPartyTransactions", "fxCommitments", "apAging", "customerMetrics", "policies",
  ] as const;

  const dedupeRecords = (field: typeof arrayFields[number], records: unknown[]) => {
    if (field === "apInvoices" || field === "payments") return records;
    const seen = new Set<string>();
    return records.filter((record) => {
      const value = record as Record<string, unknown>;
      const key = [value.id, value.source, value.page, value.date, value.period, value.vendor, value.customer, value.invoiceNumber, value.reference, value.amount, value.metric, value.item].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const first = passResults.find(Boolean) || options?.seedData;
  const result = {
    companyName: passResults.map((result) => result.companyName).find(Boolean) || first?.companyName || "",
    currency: passResults.map((result) => result.currency).find(Boolean) || first?.currency || "EUR",
    reportingPeriods: [...new Set([...(options?.seedData?.reportingPeriods || []), ...passResults.flatMap((result) => result.reportingPeriods)])],
    sourceFile: fileName,
    ...Object.fromEntries(arrayFields.map((field) => [field, dedupeRecords(field, [
      ...((options?.seedData?.[field] || []) as unknown[]),
      ...passResults.flatMap((result) => result[field] as unknown[]),
    ])])),
    notes: [...new Set([...(options?.seedData?.notes || []), ...passResults.flatMap((result) => result.notes)])],
  } as ExtractedFinancialData;

  if (uploadedFileId) {
    await openai.files.delete(uploadedFileId).catch(() => undefined);
  }

  return result;
}
