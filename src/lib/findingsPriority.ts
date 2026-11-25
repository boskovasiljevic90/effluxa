/**
 * Effluxa finding prioritisation.
 *
 * The audit engine can legitimately return 50-150 findings on a complete
 * financial pack. A customer cannot act on 150 items, so every surface that
 * shows results must lead with a short, ranked action list.
 *
 * Ranking is deliberately biased towards *recoverable* leakage (duplicate
 * payments, avoidable cost, control exceptions) and away from diagnostic
 * ratios (margin gaps, budget variance) that are context, not money.
 */

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RawFinding = {
  id?: string;
  ruleId?: string;
  title?: string;
  category?: string;
  severity?: string;
  confidence?: number;
  description?: string;
  recommendedAction?: string;
  evidence?: unknown[];
  quantification?: { type?: string; amount?: number | null; currency?: string };
};

export type RankedFinding = {
  id: string;
  ruleId: string;
  title: string;
  category: string;
  severity: Severity;
  confidence: number;
  description: string;
  recommendedAction: string;
  amount: number | null;
  currency: string;
  evidenceCount: number;
  score: number;
};

export type PrioritizedFindings = {
  actNow: RankedFinding[];
  next: RankedFinding[];
  monitorCount: number;
  total: number;
  /** Sum of amounts on the recoverable categories only. */
  recoverableAmount: number;
  /** Sum of every quantified amount, including diagnostic ratios. */
  quantifiedAmount: number;
  currency: string;
  criticalCount: number;
  highCount: number;
  duplicateExposure: number;
  avoidableCost: number;
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  CRITICAL: 100,
  HIGH: 60,
  MEDIUM: 25,
  LOW: 8,
};

/**
 * Some categories are "money you can get back this month", others are
 * "context that explains the money". Weight accordingly.
 */
const CATEGORY_ACTIONABILITY: Record<string, number> = {
  DUPLICATE_PAYMENT: 1.7,
  FRAUD_INDICATOR: 1.55,
  COST_LEAKAGE: 1.4,
  CONTROL_EXCEPTION: 1.25,
  ACCOUNTING_ANOMALY: 1.1,
  WORKING_CAPITAL: 1.0,
  COMPLIANCE: 0.95,
  LIQUIDITY_RISK: 0.72,
};

const RECOVERABLE_CATEGORIES = new Set([
  "DUPLICATE_PAYMENT",
  "COST_LEAKAGE",
  "FRAUD_INDICATOR",
  "CONTROL_EXCEPTION",
  "ACCOUNTING_ANOMALY",
]);

const DUPLICATE_RULES = new Set([
  "AP_EXACT_DUPLICATE",
  "AP_NEAR_DUPLICATE",
  "AP_SPLIT_INVOICE",
  "RECURRING_ROUND_PAYMENT",
  "UNAPPLIED_CREDIT_NOTE",
]);

const AVOIDABLE_COST_RULES = new Set([
  "SOFTWARE_LICENSE_WASTE",
  "SOFTWARE_TOOL_OVERLAP",
  "LEGACY_SYSTEM_COST",
  "VENDOR_PRICE_INCREASE",
  "RELATED_PARTY_PRICE_CHANGE",
  "T_AND_E_PERSONAL_EXPENSE",
  "T_AND_E_DUPLICATE_CLAIM",
]);

function normaliseSeverity(value: unknown): Severity {
  const severity = String(value || "MEDIUM").toUpperCase();
  if (severity === "CRITICAL" || severity === "HIGH" || severity === "LOW") return severity;
  return "MEDIUM";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function amountScore(amount: number | null) {
  if (!amount) return 0;
  // 10 EUR -> ~0.35, 1k -> ~0.85, 100k -> ~1.7, capped at 2.
  return Math.min(2, Math.log10(amount + 10) / 2.2);
}

export function rankFinding(finding: RawFinding, index: number): RankedFinding {
  const severity = normaliseSeverity(finding.severity);
  const category = String(finding.category || "UNCATEGORISED").toUpperCase();
  const ruleId = String(finding.ruleId || "UNKNOWN_RULE");
  const amount = toNumber(finding.quantification?.amount);
  const confidence =
    typeof finding.confidence === "number" && Number.isFinite(finding.confidence)
      ? Math.max(0.3, Math.min(1, finding.confidence))
      : 0.6;
  const actionability = CATEGORY_ACTIONABILITY[category] ?? 0.9;

  const score =
    SEVERITY_WEIGHT[severity] *
    actionability *
    (0.55 + confidence * 0.45) *
    (1 + amountScore(amount));

  return {
    id: toText(finding.id, `${ruleId}-${index}`),
    ruleId,
    title: toText(finding.title, "Financial control finding"),
    category,
    severity,
    confidence,
    description: toText(finding.description),
    recommendedAction: toText(finding.recommendedAction),
    amount,
    currency: toText(finding.quantification?.currency, "EUR").toUpperCase(),
    evidenceCount: Array.isArray(finding.evidence) ? finding.evidence.length : 0,
    score,
  };
}

function dedupeKey(finding: RankedFinding) {
  // Collapse repeated instances of the same rule on the same subject so the
  // action list does not repeat the same recommendation five times.
  return `${finding.ruleId}|${finding.title.toLowerCase().slice(0, 48)}`;
}

export function prioritizeFindings(rawFindings: unknown): PrioritizedFindings {
  const list = Array.isArray(rawFindings) ? (rawFindings as RawFinding[]) : [];
  const ranked = list
    .filter((finding) => finding && typeof finding === "object")
    .map((finding, index) => rankFinding(finding, index))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const unique: RankedFinding[] = [];
  for (const finding of ranked) {
    const key = dedupeKey(finding);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }

  const actNow = unique.slice(0, 3);
  const next = unique.slice(3, 10);

  const recoverableAmount = unique
    .filter((finding) => RECOVERABLE_CATEGORIES.has(finding.category))
    .reduce((sum, finding) => sum + (finding.amount || 0), 0);

  const quantifiedAmount = unique.reduce((sum, finding) => sum + (finding.amount || 0), 0);

  const duplicateExposure = unique
    .filter((finding) => DUPLICATE_RULES.has(finding.ruleId))
    .reduce((sum, finding) => sum + (finding.amount || 0), 0);

  const avoidableCost = unique
    .filter((finding) => AVOIDABLE_COST_RULES.has(finding.ruleId))
    .reduce((sum, finding) => sum + (finding.amount || 0), 0);

  return {
    actNow,
    next,
    monitorCount: Math.max(0, unique.length - actNow.length - next.length),
    total: unique.length,
    recoverableAmount: Math.round(recoverableAmount),
    quantifiedAmount: Math.round(quantifiedAmount),
    currency: unique[0]?.currency || "EUR",
    criticalCount: unique.filter((finding) => finding.severity === "CRITICAL").length,
    highCount: unique.filter((finding) => finding.severity === "HIGH").length,
    duplicateExposure: Math.round(duplicateExposure),
    avoidableCost: Math.round(avoidableCost),
  };
}

/** Plain-language one-line verdict used as the headline of a teaser report. */
export function buildVerdict(priority: PrioritizedFindings) {
  if (priority.total === 0) {
    return "No structured leakage pattern was detected in this file. Upload a more complete export (invoice ledger, payments, P&L) for a stronger screen.";
  }

  const money = priority.duplicateExposure + priority.avoidableCost;
  const top = priority.actNow[0];

  if (money > 0) {
    return `${priority.total} review items detected. The strongest recoverable signal is ${top ? top.title.toLowerCase() : "a payment or cost exception"} at roughly ${formatMoney(money, priority.currency)}.`;
  }

  return `${priority.total} review items detected. Start with "${top?.title || "the highest-severity finding"}", then validate the evidence before acting.`;
}

export function formatMoney(amount: number, currency = "EUR") {
  const rounded = Math.round(amount);
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${rounded.toLocaleString("en-GB")} ${currency || "EUR"}`;
  }
}
