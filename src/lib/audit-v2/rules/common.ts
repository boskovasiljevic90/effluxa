import type { AuditFinding, Evidence, FindingCategory, QuantificationType, Severity } from "../types";
import { evidenceFor, normalizeDate, text } from "../utils";

let sequence = 0;

export function resetFindingSequence() {
  sequence = 0;
}

export function sourceEvidence(
  record: Record<string, unknown>,
  detail: string,
  values: Partial<Omit<Evidence, "source" | "detail">> = {}
) {
  return evidenceFor(
    text(record.source, "Uploaded financial document"),
    detail,
    {
      page: typeof record.page === "number" ? record.page : null,
      row: typeof record.row === "number" ? record.row : null,
      sheet: typeof record.sheet === "string" ? record.sheet : null,
      ...values,
    }
  );
}

export function createFinding({
  ruleId,
  category,
  title,
  severity,
  confidence,
  description,
  evidence,
  amount,
  currency,
  quantificationType = "UNQUANTIFIED",
  recommendedAction,
}: {
  ruleId: string;
  category: FindingCategory;
  title: string;
  severity: Severity;
  confidence: number;
  description: string;
  evidence: Evidence[];
  amount?: number | null;
  currency?: string;
  quantificationType?: QuantificationType;
  recommendedAction: string;
}): AuditFinding {
  sequence += 1;
  const evidenceKey = evidence
    .map((item) => `${item.vendor || ""}-${item.invoice || ""}-${item.date || ""}`)
    .join("-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 70);

  return {
    id: `${ruleId}-${sequence}${evidenceKey ? `-${evidenceKey}` : ""}`,
    ruleId,
    category,
    title,
    severity,
    confidence: Math.max(0, Math.min(1, confidence)),
    description,
    evidence,
    quantification: {
      type: quantificationType,
      amount: typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? amount : null,
      currency: text(currency, "EUR").toUpperCase(),
    },
    recommendedAction,
  };
}

export function dateValue(value: unknown) {
  return normalizeDate(value);
}
