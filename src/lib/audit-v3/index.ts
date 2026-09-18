import { buildLegacyReport } from "../audit-v2/build-report";
import { extractFinancialData } from "../audit-v2/extractor";
import { runReasoningCrossCheck } from "../audit-v2/reasoning";
import { runDeterministicRules } from "../audit-v2/rules";
import { scoreFindings } from "../audit-v2/scoring";
import { verifyFindings } from "../audit-v2/verifier";
import type { AuditV2Result } from "../audit-v2/types";
import { buildFastTextData, hasFastTextCoverage } from "./fast-text";
import { createV3ExtractionOptions } from "./routing";

export async function runAuditV3({
  file,
  fileName,
  financialText,
  language = "English",
}: {
  file: File;
  fileName: string;
  financialText?: string;
  language?: string;
}): Promise<AuditV2Result> {
  const fastTextData = buildFastTextData(financialText || "", fileName);
  const fastTextPath = Boolean(fastTextData && hasFastTextCoverage(fastTextData));
  const extractionOptions = createV3ExtractionOptions(financialText || "");

  if (fastTextPath && fastTextData) {
    // The validated text-native layout is complete enough to avoid AI
    // transcription entirely. This is the sub-30-second V3 path; documents
    // that do not meet the coverage gate keep the format-adaptive AI fallback.
    extractionOptions.skipPasses = [
      "invoice-ledger",
      "payments-and-controls",
      "working-capital-and-kpis",
      "opex-people-and-assets",
      "financing-and-related-parties",
    ];
    extractionOptions.seedData = fastTextData;
  }

  const extractedData = await extractFinancialData({
    file,
    fileName,
    financialText,
    language,
    options: extractionOptions,
  });
  const findings = verifyFindings(runDeterministicRules(extractedData));
  const metrics = scoreFindings(findings);
  const reasoning = await runReasoningCrossCheck({
    data: extractedData,
    findings,
    metrics,
    useAi: false,
  });

  return {
    analysisVersion: "3.0",
    analysisPath: fastTextPath ? "fast_text" : "routed_ai",
    extractedData,
    findings,
    metrics,
    executiveSummary: reasoning.summary || `Effluxa identified ${findings.length} verified review item(s) from the uploaded document.`,
    cfoSummary: reasoning.cfoSummary || "Validate the evidence and quantify the financial impact before taking action.",
    reasoningThemes: reasoning.themes,
    recommendedActions: reasoning.actions,
  };
}

export async function analyzeAuditV3(args: {
  file: File;
  fileName: string;
  financialText?: string;
  language?: string;
}) {
  const result = await runAuditV3(args);
  return buildLegacyReport(result, {
    fileName: args.fileName,
    financialText: args.financialText,
  });
}

export { createV3ExtractionOptions, getV3RoutingStats, routeFinancialTextV3 } from "./routing";
export { canUseFastTextPath, hasFastTextCoverage } from "./fast-text";
