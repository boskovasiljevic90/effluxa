import type { AuditV2Result, ExtractedFinancialData } from "./types";
import { confidenceLevel, leakageScore, riskLevel } from "./scoring";

function topVendors(data: ExtractedFinancialData) {
  const totals = new Map<string, number>();
  for (const invoice of data.apInvoices) {
    if (!invoice.vendor || invoice.amount <= 0) continue;
    totals.set(invoice.vendor, (totals.get(invoice.vendor) || 0) + invoice.amount);
  }
  return Array.from(totals.entries())
    .map(([vendor, amount]) => ({ vendor, amount: Math.round(amount), reason: "Highest recorded AP spend in the extracted document." }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

function highCostCategories(data: ExtractedFinancialData) {
  const totals = new Map<string, number>();
  for (const invoice of data.apInvoices) {
    const category = invoice.category || "Uncategorized AP";
    if (invoice.amount <= 0) continue;
    totals.set(category, (totals.get(category) || 0) + invoice.amount);
  }
  return Array.from(totals.entries())
    .map(([category, amount]) => ({ category, amount: Math.round(amount), reason: "Highest recorded category spend in the extracted document." }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

function extractedRecordCount(data: ExtractedFinancialData) {
  return Object.values(data)
    .reduce(
      (total, value) => total + (Array.isArray(value) ? value.length : 0),
      0
    );
}

export function buildLegacyReport(
  result: AuditV2Result,
  context: { fileName?: string; financialText?: string } = {},
  analysisVersion: "2.0" | "3.0" = result.analysisVersion
) {
  const score = leakageScore(result.findings);
  const duplicateFindings = result.findings.filter((finding) => finding.category === "DUPLICATE_PAYMENT");
  const anomalies = result.findings
    .filter((finding) => finding.category === "ACCOUNTING_ANOMALY" || finding.category === "CONTROL_EXCEPTION")
    .map((finding) => ({ item: finding.title, reason: finding.description }));

  return {
    analysisVersion,
    extractedData: result.extractedData,
    findings: result.findings,
    metrics: result.metrics,
    quantifiedOpportunity: result.metrics.quantifiedOpportunity,
    executive_summary: result.executiveSummary,
    leakage_score: score,
    risk_level: riskLevel(score),
    estimated_savings: result.metrics.quantifiedOpportunity,
    confidence_level: confidenceLevel(result.findings),
    key_findings: result.findings.slice(0, 12).map((finding) => `${finding.title}: ${finding.description}`),
    top_vendors: topVendors(result.extractedData),
    high_cost_categories: highCostCategories(result.extractedData),
    anomalies,
    duplicate_payment_risks: duplicateFindings.map((finding) => ({
      item: finding.title,
      reason: `${finding.description} Potential exposure: ${finding.quantification.amount?.toLocaleString() || "unquantified"} ${finding.quantification.currency}.`,
    })),
    cashflow_observations: [
      result.metrics.workingCapitalExposure > 0
        ? `Working-capital exposure requiring review: EUR ${result.metrics.workingCapitalExposure.toLocaleString()}.`
        : "No quantified working-capital exposure was identified by the deterministic rules.",
      result.metrics.controlRiskExposure > 0
        ? `Control-risk exposure requiring validation: EUR ${result.metrics.controlRiskExposure.toLocaleString()}.`
        : "No quantified control-risk exposure was identified by the deterministic rules.",
    ],
    quick_wins: result.recommendedActions.slice(0, 6),
    recommendations: result.recommendedActions.slice(0, 10),
    cfo_summary: result.cfoSummary,
    reasoning_themes: result.reasoningThemes,
    report_quality: {
      fallback_used: false,
      input_character_count: context.financialText?.length || 0,
      generated_at: new Date().toISOString(),
      analysis_path:
        result.analysisPath || (analysisVersion === "3.0" ? "routed_ai" : "legacy_ai"),
      extracted_record_count: extractedRecordCount(result.extractedData),
      verified_finding_count: result.findings.length,
    },
    source_file: context.fileName || result.extractedData.sourceFile,
  };
}
