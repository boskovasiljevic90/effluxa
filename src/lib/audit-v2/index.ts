import { buildLegacyReport } from "./build-report";
import { extractFinancialData } from "./extractor";
import { runReasoningCrossCheck } from "./reasoning";
import { runDeterministicRules } from "./rules";
import { confidenceLevel, leakageScore, riskLevel, scoreFindings } from "./scoring";
import { verifyFindings } from "./verifier";
import type { AuditV2Result } from "./types";

export async function runAuditV2({
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
  const extractedData = await extractFinancialData({
    file,
    fileName,
    financialText,
    language,
  });
  const findings = verifyFindings(runDeterministicRules(extractedData));
  const metrics = scoreFindings(findings);
  const reasoning = await runReasoningCrossCheck({
    data: extractedData,
    findings,
    metrics,
  });

  return {
    analysisVersion: "2.0",
    analysisPath: "legacy_ai",
    extractedData,
    findings,
    metrics,
    executiveSummary: reasoning.summary || `Effluxa identified ${findings.length} verified review item(s) from the uploaded document.`,
    cfoSummary: reasoning.cfoSummary || "Validate the evidence and quantify the financial impact before taking action.",
    reasoningThemes: reasoning.themes,
    recommendedActions: reasoning.actions,
  };
}

export async function analyzeAuditV2(args: {
  file: File;
  fileName: string;
  financialText?: string;
  language?: string;
}) {
  const result = await runAuditV2(args);
  return buildLegacyReport(result, {
    fileName: args.fileName,
    financialText: args.financialText,
  });
}

export { buildLegacyReport, confidenceLevel, leakageScore, riskLevel, scoreFindings, verifyFindings };
export * from "./types";
