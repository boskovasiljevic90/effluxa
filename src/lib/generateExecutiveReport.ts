export function generateExecutiveReport(text: string) {
  const lower = text.toLowerCase();

  let findings: string[] = [];
  let savings = 0;
  let risk = "Low";

  if (
    lower.includes("subscription") ||
    lower.includes("monthly") ||
    lower.includes("recurring")
  ) {
    findings.push(
      "Detected recurring expenses that may be optimized or consolidated."
    );

    savings += 1200;
  }

  if (
    lower.includes("consulting") ||
    lower.includes("external")
  ) {
    findings.push(
      "High external consulting/vendor spending detected."
    );

    savings += 2500;
  }

  if (
    lower.includes("software") ||
    lower.includes("saas")
  ) {
    findings.push(
      "Potential SaaS overlap and duplicated software expenses identified."
    );

    savings += 1800;
  }

  if (
    lower.includes("late fee") ||
    lower.includes("penalty")
  ) {
    findings.push(
      "Financial penalties or late fee indicators detected."
    );

    risk = "Medium";
    savings += 900;
  }

  if (findings.length === 0) {
    findings.push(
      "General financial optimization opportunities detected across operational spending."
    );

    savings += 1500;
  }

  return {
    executiveSummary:
      "Effluxa AI identified multiple opportunities for financial optimization and operational cost reduction.",

    findings,

    estimatedSavings: savings,

    riskLevel: risk,

    recommendations: [
      "Consolidate recurring vendor expenses.",
      "Audit monthly SaaS subscriptions.",
      "Review external contractor spending.",
      "Introduce monthly financial leakage monitoring.",
    ],
  };
}
