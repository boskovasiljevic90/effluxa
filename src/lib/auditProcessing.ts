import OpenAI from "openai";
import * as XLSX from "xlsx";
import { buildFallbackAuditReport, normalizeAuditReport, shouldUseFallbackReport } from "@/lib/reportQuality";
import { extractText } from "@/lib/fileParser";
import { analyzeAuditV2 } from "@/lib/audit-v2";
import { analyzeAuditV3 } from "@/lib/audit-v3";

function extractJSON(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  return match[0]
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

function safeParseAIJson(raw: string) {
  const jsonString = extractJSON(raw);

  if (!jsonString) {
    throw new Error("AI did not return JSON.");
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

type LegacyContentPart =
  | { type: "input_file"; file_data?: string; file_id?: string; filename?: string }
  | { type: "input_text"; text: string };

async function analyzeWithAI(file: File, financialText?: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const content: LegacyContentPart[] = [];

  if (isPdf) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = `data:application/pdf;base64,${buffer.toString("base64")}`;

    content.push({
      type: "input_file",
      file_data: base64File,
      filename: file.name,
    });
  }

  content.push({
    type: "input_text",
    text: `
You are Effluxa, a senior AI financial leakage auditor for small and mid-sized businesses.

Your job is to analyze uploaded financial documents and identify:
- unnecessary cost leakage
- overspending patterns
- vendor concentration risks
- duplicate or suspicious payments
- cash flow pressure
- operational inefficiencies
- practical savings opportunities

Return ONLY valid JSON.
Do not use markdown.
Do not add comments.
Do not add trailing commas.
If the document does not contain enough information for a field, use an empty array or "Insufficient data".

Return exactly this JSON structure:

{
  "executive_summary": "clear executive summary in 3-5 sentences",
  "leakage_score": 0,
  "risk_level": "Low | Medium | High | Critical",
  "estimated_savings": 0,
  "confidence_level": "Low | Medium | High",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "top_vendors": [
    { "vendor": "Vendor name", "amount": 0, "reason": "why this vendor matters" }
  ],
  "high_cost_categories": [
    { "category": "Category name", "amount": 0, "observation": "cost observation" }
  ],
  "anomalies": [
    { "item": "Anomaly", "reason": "why it may require review" }
  ],
  "duplicate_payment_risks": [
    { "item": "Possible duplicate", "reason": "why it may be duplicate" }
  ],
  "cashflow_observations": ["observation 1", "observation 2"],
  "quick_wins": ["quick win 1", "quick win 2", "quick win 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "cfo_summary": "short CFO-style conclusion"
}

Rules:
- leakage_score must be 0-100.
- estimated_savings must be numeric EUR estimate.
- Do not invent vendor names if not visible.
- If amounts are unclear, be conservative.
- Focus on practical business action, not generic advice.
- For weak or incomplete documents, explicitly say data is limited.

Financial data:
${financialText ? financialText.slice(0, 30000) : ""}
`,
  });

  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content,
      },
    ],
  } as unknown as Parameters<typeof openai.responses.create>[0]) as unknown as { output_text?: string };

  return safeParseAIJson(response.output_text || "");
}

async function extractFinancialText(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".csv")) {
    return file.text();
  }

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
  }

  if (lowerName.endsWith(".pdf")) {
    return extractText(Buffer.from(await file.arrayBuffer()), "application/pdf");
  }

  return "";
}

export function getAuditEngine() {
  // Production is permanently on V3. Environment flags remain useful for local
  // smoke tests, but cannot silently route the live app to an older engine.
  return process.env.NODE_ENV === "production"
    ? "v3"
    : process.env.EFFLUXA_AUDIT_V3_ENABLED === "true"
      ? "v3"
      : process.env.EFFLUXA_AUDIT_V2_ENABLED === "true"
        ? "v2"
        : "v1";
}

export async function processAuditFile({
  file,
  fileName,
  language = "English",
}: {
  file: File;
  fileName: string;
  language?: string;
}) {
  const financialText = await extractFinancialText(file);
  const analysisStartedAt = Date.now();
  const auditEngine = getAuditEngine();
  let parsedData: any;
  let fallbackUsed = false;

  try {
    if (auditEngine === "v3") {
      parsedData = await analyzeAuditV3({
        file,
        fileName,
        financialText,
        language,
      });
    } else if (auditEngine === "v2") {
      parsedData = await analyzeAuditV2({
        file,
        fileName,
        financialText,
        language,
      });
    } else {
      parsedData = normalizeAuditReport(
        await analyzeWithAI(file, financialText),
        {
          fileName,
          financialText,
        }
      );
    }
  } catch (analysisError) {
    if (!shouldUseFallbackReport(analysisError)) {
      throw analysisError;
    }

    console.warn("AUDIT JOB FALLBACK REPORT USED:", analysisError);
    fallbackUsed = true;
    parsedData = buildFallbackAuditReport({
      fileName,
      financialText,
      reason:
        analysisError instanceof Error
          ? analysisError.message
          : "AI output could not be converted into the required audit schema.",
    });
  }

  if (parsedData && typeof parsedData === "object" && !Array.isArray(parsedData)) {
    const reportData = parsedData as Record<string, any>;
    const existingQuality =
      reportData.report_quality &&
      typeof reportData.report_quality === "object" &&
      !Array.isArray(reportData.report_quality)
        ? reportData.report_quality
        : {};

    parsedData = {
      ...reportData,
      report_quality: {
        ...existingQuality,
        audit_engine: auditEngine,
        analysis_duration_ms: Date.now() - analysisStartedAt,
        fallback_used: fallbackUsed || existingQuality.fallback_used === true,
      },
    };
  }

  return {
    parsedData,
    auditEngine,
    fallbackUsed,
    financialText,
    analysisDurationMs: Date.now() - analysisStartedAt,
  };
}
