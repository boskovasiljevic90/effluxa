import { buildVerdict, formatMoney, prioritizeFindings } from "@/lib/findingsPriority";

export const INSTANT_AUDIT_MAX_BYTES = 4 * 1024 * 1024;

export type InstantFinding = {
  title: string;
  severity: string;
  category: string;
  amount: number | null;
  currency: string;
  description: string;
  recommendedAction: string;
  evidenceCount: number;
  confidence: number;
};

export type InstantTeaser = {
  fileName: string;
  fileType: string;
  createdAt: string;
  leakageScore: number;
  riskLevel: string;
  confidenceLevel: string;
  verdict: string;
  currency: string;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  duplicateExposure: number;
  avoidableCost: number;
  recoverableAmount: number;
  actNow: InstantFinding[];
  locked: {
    remainingFindings: number;
    quantifiedAmount: number;
    categories: string[];
  };
  limitedData: boolean;
  auditEngine: string;
  processingMs: number;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function riskFromScore(score: number) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function safeFileName(name: string) {
  // Never echo a full path or an email address that a user may have put in a
  // file name. Keep it short and plain.
  const base = name.split(/[\\/]/).pop() || "uploaded file";
  return base.replace(/[^\w.\- ]/g, "").slice(0, 80) || "uploaded file";
}

function toInstantFinding(finding: {
  title: string;
  severity: string;
  category: string;
  amount: number | null;
  currency: string;
  description: string;
  recommendedAction: string;
  evidenceCount: number;
  confidence: number;
}): InstantFinding {
  return {
    title: finding.title,
    severity: finding.severity,
    category: finding.category,
    amount: finding.amount,
    currency: finding.currency,
    // Description is engine-generated from structured data, never raw document
    // text, so it is safe to show. Cap the length for the teaser.
    description: finding.description.slice(0, 420),
    recommendedAction: finding.recommendedAction.slice(0, 300),
    evidenceCount: finding.evidenceCount,
    confidence: finding.confidence,
  };
}

export function buildInstantTeaser({
  parsedData,
  fileName,
  fileType,
  auditEngine,
  fallbackUsed,
  analysisDurationMs,
}: {
  parsedData: unknown;
  fileName: string;
  fileType: string;
  auditEngine: string;
  fallbackUsed: boolean;
  analysisDurationMs: number;
}): InstantTeaser {
  const report = (parsedData && typeof parsedData === "object" ? parsedData : {}) as Record<string, unknown>;
  const priority = prioritizeFindings(report.findings);
  const metrics = (report.metrics && typeof report.metrics === "object" ? report.metrics : {}) as Record<string, unknown>;

  const measuredScore = toNumber(report.leakage_score, 0);
  const leakageScore = measuredScore > 0 ? Math.round(measuredScore) : Math.min(97, priority.criticalCount * 12 + priority.highCount * 5 + Math.min(30, priority.total));
  const riskLevel = toText(report.risk_level, riskFromScore(leakageScore));

  const categories = Array.from(
    new Set(priority.next.concat(priority.actNow).map((finding) => finding.category))
  ).slice(0, 6);

  const quantifiedAmount = Math.max(
    priority.quantifiedAmount,
    toNumber(metrics.quantifiedOpportunity, 0) + toNumber(metrics.potentialDuplicateExposure, 0)
  );

  return {
    fileName: safeFileName(fileName),
    fileType,
    createdAt: new Date().toISOString(),
    leakageScore,
    riskLevel,
    confidenceLevel: toText(report.confidence_level, priority.total > 0 ? "Medium" : "Low"),
    verdict: buildVerdict(priority),
    currency: priority.currency,
    totalFindings: priority.total,
    criticalCount: priority.criticalCount,
    highCount: priority.highCount,
    duplicateExposure: priority.duplicateExposure,
    avoidableCost: priority.avoidableCost,
    recoverableAmount: priority.recoverableAmount,
    actNow: priority.actNow.map(toInstantFinding),
    locked: {
      remainingFindings: Math.max(0, priority.total - priority.actNow.length),
      quantifiedAmount: Math.round(quantifiedAmount),
      categories,
    },
    limitedData: fallbackUsed || priority.total === 0,
    auditEngine,
    processingMs: analysisDurationMs,
  };
}

export function instantHeadline(teaser: InstantTeaser) {
  const money = teaser.duplicateExposure + teaser.avoidableCost;
  if (teaser.limitedData) {
    return "This file gave a limited but honest signal.";
  }
  if (money > 0) {
    return `${formatMoney(money, teaser.currency)} of recoverable leakage signals found`;
  }
  return `${teaser.totalFindings} review items found in ${teaser.fileName}`;
}
