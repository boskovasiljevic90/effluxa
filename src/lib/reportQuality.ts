type UnknownRecord = Record<string, unknown>;

type ReportContext = {
  fileName?: string;
  financialText?: string;
  reason?: string;
};

type AuditVendor = {
  vendor: string;
  amount: number;
  reason: string;
};

type AuditCategory = {
  category: string;
  amount: number;
  reason: string;
};

type AuditReport = {
  executive_summary: string;
  leakage_score: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  estimated_savings: number;
  confidence_level: "Low" | "Medium" | "High";
  key_findings: string[];
  top_vendors: AuditVendor[];
  high_cost_categories: AuditCategory[];
  duplicate_payment_risks: string[];
  cashflow_observations: string[];
  quick_wins: string[];
  recommendations: string[];
  cfo_summary: string;
  report_quality: {
    fallback_used: boolean;
    reason?: string;
    input_character_count: number;
    generated_at: string;
  };
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function toTextArray(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (isRecord(item)) {
          const candidate =
            item.finding ||
            item.recommendation ||
            item.observation ||
            item.reason ||
            item.summary ||
            item.name;

          return typeof candidate === "string" ? candidate.trim() : "";
        }

        return "";
      })
      .filter(Boolean);

    if (items.length > 0) {
      return items;
    }
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return fallback;
}

function normalizeRiskLevel(value: unknown): AuditReport["risk_level"] {
  const text = String(value || "").toLowerCase();

  if (text.includes("critical")) return "Critical";
  if (text.includes("high")) return "High";
  if (text.includes("medium")) return "Medium";
  if (text.includes("low")) return "Low";

  return "Low";
}

function normalizeConfidenceLevel(value: unknown): AuditReport["confidence_level"] {
  const text = String(value || "").toLowerCase();

  if (text.includes("high")) return "High";
  if (text.includes("medium")) return "Medium";
  if (text.includes("low")) return "Low";

  return "Low";
}

function normalizeVendors(value: unknown): AuditVendor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) return null;

      const vendor = toText(item.vendor || item.name, "");
      const reason = toText(item.reason || item.description, "Vendor appeared in the uploaded document.");

      if (!vendor) return null;

      return {
        vendor,
        amount: Math.max(0, toNumber(item.amount, 0)),
        reason,
      };
    })
    .filter((item): item is AuditVendor => Boolean(item));
}

function normalizeCategories(value: unknown): AuditCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) return null;

      const category = toText(item.category || item.name, "");
      const reason = toText(item.reason || item.description, "Category appeared in the uploaded document.");

      if (!category) return null;

      return {
        category,
        amount: Math.max(0, toNumber(item.amount, 0)),
        reason,
      };
    })
    .filter((item): item is AuditCategory => Boolean(item));
}

function inputCharacterCount(context: ReportContext) {
  return context.financialText?.length || 0;
}

export function buildFallbackAuditReport(context: ReportContext = {}): AuditReport {
  const fileName = context.fileName || "uploaded file";
  const reason =
    context.reason ||
    "The AI response could not be converted into the required audit schema.";

  return {
    executive_summary:
      `Effluxa received ${fileName}, but the document did not provide enough reliable structured financial data for a complete automated audit. ` +
      "The report below is intentionally conservative and avoids inventing vendors, savings, or risks that are not clearly supported by the uploaded file.",
    leakage_score: 0,
    risk_level: "Low",
    estimated_savings: 0,
    confidence_level: "Low",
    key_findings: [
      "The uploaded document could not be converted into a complete structured audit with high confidence.",
      "No vendor-level savings estimate is shown because the available data was limited or unclear.",
      "Upload a detailed bank export, expense ledger, accounts payable file, or invoice register for a stronger analysis.",
    ],
    top_vendors: [],
    high_cost_categories: [],
    duplicate_payment_risks: [
      "No duplicate payment risk could be confirmed from the available data.",
    ],
    cashflow_observations: [
      "Cashflow patterns could not be reliably assessed from the available data.",
    ],
    quick_wins: [
      "Re-upload the source file as CSV or XLSX when possible.",
      "Include dates, vendors, descriptions, categories, and transaction amounts.",
      "Use a complete reporting period, such as one full month or quarter.",
    ],
    recommendations: [
      "Provide a cleaner export with vendor names, transaction dates, and amounts.",
      "Avoid scanned or image-only documents when a structured CSV or spreadsheet is available.",
      "Review the uploaded file manually before using this report for business decisions.",
    ],
    cfo_summary:
      "This audit is a limited-data fallback report. It should be treated as a prompt to upload a more complete financial export, not as a final financial conclusion.",
    report_quality: {
      fallback_used: true,
      reason,
      input_character_count: inputCharacterCount(context),
      generated_at: new Date().toISOString(),
    },
  };
}

export function normalizeAuditReport(input: unknown, context: ReportContext = {}): AuditReport {
  const fallback = buildFallbackAuditReport(context);

  if (!isRecord(input)) {
    return fallback;
  }

  const recommendations = toTextArray(input.recommendations, fallback.recommendations);
  const keyFindings = toTextArray(
    input.key_findings,
    recommendations.length > 0 ? recommendations : fallback.key_findings
  );

  return {
    executive_summary: toText(input.executive_summary, fallback.executive_summary),
    leakage_score: clamp(Math.round(toNumber(input.leakage_score, 0)), 0, 100),
    risk_level: normalizeRiskLevel(input.risk_level),
    estimated_savings: Math.max(0, Math.round(toNumber(input.estimated_savings, 0))),
    confidence_level: normalizeConfidenceLevel(input.confidence_level),
    key_findings: keyFindings,
    top_vendors: normalizeVendors(input.top_vendors),
    high_cost_categories: normalizeCategories(input.high_cost_categories),
    duplicate_payment_risks: toTextArray(
      input.duplicate_payment_risks,
      fallback.duplicate_payment_risks
    ),
    cashflow_observations: toTextArray(
      input.cashflow_observations,
      fallback.cashflow_observations
    ),
    quick_wins: toTextArray(input.quick_wins, fallback.quick_wins),
    recommendations,
    cfo_summary: toText(input.cfo_summary, fallback.cfo_summary),
    report_quality: {
      fallback_used: false,
      input_character_count: inputCharacterCount(context),
      generated_at: new Date().toISOString(),
    },
  };
}

export function shouldUseFallbackReport(error: unknown) {
  const message = String(
    error instanceof Error ? error.message : error || ""
  ).toLowerCase();

  const unavailableSignals = [
    "429",
    "quota",
    "billing",
    "insufficient_quota",
    "rate_limit",
    "timeout",
    "network",
    "fetch failed",
    "service unavailable",
  ];

  if (unavailableSignals.some((signal) => message.includes(signal))) {
    return false;
  }

  const recoverableSignals = [
    "ai did not return json",
    "ai returned invalid json",
    "invalid json",
    "did not return json",
    "could not be converted",
    "schema",
    "empty",
  ];

  return recoverableSignals.some((signal) => message.includes(signal));
}
