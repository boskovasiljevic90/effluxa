import type { AuditFinding, AuditMetrics, Severity } from "./types";

function sumByRule(findings: AuditFinding[], ruleIds: string[]) {
  return findings
    .filter((finding) => ruleIds.includes(finding.ruleId))
    .reduce((sum, finding) => sum + (finding.quantification.amount || 0), 0);
}

function countSeverity(findings: AuditFinding[], severity: Severity) {
  return findings.filter((finding) => finding.severity === severity).length;
}

export function scoreFindings(findings: AuditFinding[]): AuditMetrics {
  const potentialDuplicateExposure = sumByRule(findings, ["AP_EXACT_DUPLICATE"]);
  const nearDuplicateExposure = sumByRule(findings, ["AP_NEAR_DUPLICATE"]);
  const splitInvoiceExposure = sumByRule(findings, ["AP_SPLIT_INVOICE"]);
  const workingCapitalExposure = sumByRule(findings, [
    "AR_AGING_OR_CREDIT_LIMIT",
    "INVENTORY_NEGATIVE_BALANCE",
    "INVENTORY_SLOW_MOVING",
  ]);
  const controlRiskExposure = sumByRule(findings, [
    "VENDOR_BANK_CHANGE_BEFORE_PAYMENT",
    "AP_SPLIT_INVOICE",
    "WEEKEND_PAYMENT_REVIEW",
    "DEBT_COVENANT_BREACH",
  ]);
  const avoidableCostRunRate = sumByRule(findings, [
    "SOFTWARE_LICENSE_WASTE",
    "LEGACY_SYSTEM_COST",
  ]);
  const quantifiedOpportunity = avoidableCostRunRate;

  return {
    findingCount: findings.length,
    criticalFindings: countSeverity(findings, "CRITICAL"),
    highFindings: countSeverity(findings, "HIGH"),
    mediumFindings: countSeverity(findings, "MEDIUM"),
    lowFindings: countSeverity(findings, "LOW"),
    potentialDuplicateExposure: Math.round(potentialDuplicateExposure),
    nearDuplicateExposure: Math.round(nearDuplicateExposure),
    splitInvoiceExposure: Math.round(splitInvoiceExposure),
    workingCapitalExposure: Math.round(workingCapitalExposure),
    controlRiskExposure: Math.round(controlRiskExposure),
    avoidableCostRunRate: Math.round(avoidableCostRunRate),
    unquantifiedFindings: findings.filter((finding) => finding.quantification.amount === null).length,
    quantifiedOpportunity: Math.round(quantifiedOpportunity),
  };
}

export function leakageScore(findings: AuditFinding[]) {
  const severityPoints: Record<Severity, number> = {
    CRITICAL: 30,
    HIGH: 16,
    MEDIUM: 8,
    LOW: 3,
  };

  const confidenceAdjusted = findings.reduce(
    (sum, finding) => sum + severityPoints[finding.severity] * Math.max(0.5, finding.confidence),
    0
  );

  const amountSignal = findings.reduce((sum, finding) => {
    const amount = finding.quantification.amount || 0;
    return sum + Math.min(10, Math.log10(Math.max(1, amount)) * 1.5);
  }, 0);

  return Math.max(0, Math.min(100, Math.round(confidenceAdjusted + amountSignal)));
}

export function riskLevel(score: number) {
  if (score >= 75) return "Critical" as const;
  if (score >= 50) return "High" as const;
  if (score >= 25) return "Medium" as const;
  return "Low" as const;
}

export function confidenceLevel(findings: AuditFinding[]) {
  if (!findings.length) return "Low" as const;
  const average = findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length;
  if (average >= 0.9) return "High" as const;
  if (average >= 0.75) return "Medium" as const;
  return "Low" as const;
}
