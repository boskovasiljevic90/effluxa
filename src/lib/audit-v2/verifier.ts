import type { AuditFinding, Severity } from "./types";

const severities: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function replaceUnsupportedClaims(value: string) {
  const marker = "__EFFLUXA_FRAUD_MARKER__";
  return value
    .replace(/\bpotential fraud indicator\b/gi, marker)
    .replace(/\bconfirmed fraud\b/gi, marker)
    .replace(/\bfraud confirmed\b/gi, marker)
    .replace(/\bis fraud\b/gi, `is a ${marker}`)
    .replace(/\bfraud\b/gi, "potential fraud indicator")
    .replaceAll(marker, "potential fraud indicator");
}

export function verifyFindings(findings: AuditFinding[]) {
  const seen = new Set<string>();
  const verified: AuditFinding[] = [];

  for (const finding of findings) {
    if (!finding || !Array.isArray(finding.evidence) || finding.evidence.length === 0) continue;

    const evidenceKey = finding.evidence
      .map((evidence) => `${evidence.source}|${evidence.page ?? ""}|${evidence.row ?? ""}|${evidence.vendor ?? ""}|${evidence.invoice ?? ""}|${evidence.amount ?? ""}`)
      .sort()
      .join("||");
    const dedupeKey = `${finding.ruleId}|${evidenceKey}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const severity = severities.includes(finding.severity) ? finding.severity : "MEDIUM";
    const amount = finding.quantification.amount;
    const verifiedAmount = typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? amount : null;

    verified.push({
      ...finding,
      title: replaceUnsupportedClaims(finding.title),
      description: replaceUnsupportedClaims(finding.description),
      severity,
      confidence: Math.max(0, Math.min(1, Number(finding.confidence) || 0)),
      quantification: {
        ...finding.quantification,
        amount: finding.quantification.type === "UNQUANTIFIED" ? null : verifiedAmount,
      },
      recommendedAction: replaceUnsupportedClaims(finding.recommendedAction),
    });
  }

  return verified;
}
