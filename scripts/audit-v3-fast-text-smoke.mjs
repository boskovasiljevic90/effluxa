import { execFileSync } from "node:child_process";
import { createRequire, Module } from "node:module";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pdfPath = process.argv[2] || "/Users/boskovasiljevic/Downloads/Effluxa_Complex_Financial_Stress_Test.pdf";
const expectedRules = new Set([
  "AP_EXACT_DUPLICATE", "VENDOR_BANK_CHANGE_BEFORE_PAYMENT", "AP_NEAR_DUPLICATE", "AP_SPLIT_INVOICE",
  "VENDOR_PRICE_INCREASE", "AR_AGING_OR_CREDIT_LIMIT", "UNAPPLIED_CREDIT_NOTE", "MARGIN_COMPRESSION",
  "EBITDA_MARGIN_GAP", "SOFTWARE_LICENSE_WASTE", "LEGACY_SYSTEM_COST", "OVERTIME_EXCEPTION",
  "OVERTIME_TREND_ESCALATION", "T_AND_E_HOTEL_POLICY", "T_AND_E_PERSONAL_EXPENSE", "T_AND_E_DUPLICATE_CLAIM",
  "INVENTORY_NEGATIVE_BALANCE", "INVENTORY_PROVISION_GAP", "DEBT_COVENANT_BREACH", "FINANCING_LEAKAGE_REVIEW",
  "UNHEDGED_FX_EXPOSURE", "UNAPPLIED_CUSTOMER_ITEMS", "OPERATING_COST_BUDGET_GROWTH", "SOFTWARE_TOOL_OVERLAP",
  "OVERTIME_APPROVAL_EXCEPTION", "CORPORATE_CARD_THRESHOLD", "INVENTORY_SLOW_MOVING", "INVENTORY_WRITEOFF_TREND",
  "RELATED_PARTY_PRICE_CHANGE", "DIRECTOR_LOAN_RECEIVABLE", "AP_AGING_RISK", "CUSTOMER_CONCENTRATION_RISK",
  "RECURRING_ROUND_PAYMENT", "WEEKEND_PAYMENT_REVIEW",
]);

function collectTsFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTsFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

if (!existsSync(pdfPath)) throw new Error(`Fast-text smoke PDF not found: ${pdfPath}`);

const outputDir = mkdtempSync(join(tmpdir(), "effluxa-audit-v3-fast-text-"));
const startedAt = Date.now();

try {
  execFileSync("npx", [
    "tsc",
    ...collectTsFiles(join(root, "src/lib/audit-v2")),
    ...collectTsFiles(join(root, "src/lib/audit-v3")),
    "--module", "commonjs",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--outDir", outputDir,
    "--incremental", "false",
  ], { cwd: root, stdio: "inherit" });

  Module._initPaths();
  const require = createRequire(import.meta.url);
  const pdfParse = require(join(root, "node_modules/pdf-parse"));
  const { buildFastTextData, hasFastTextCoverage } = require(join(outputDir, "audit-v3", "fast-text.js"));
  const { normalizeExtractedData } = require(join(outputDir, "audit-v2", "normalizer.js"));
  const { runDeterministicRules } = require(join(outputDir, "audit-v2", "rules", "index.js"));
  const { verifyFindings } = require(join(outputDir, "audit-v2", "verifier.js"));
  const { scoreFindings } = require(join(outputDir, "audit-v2", "scoring.js"));
  const { buildLegacyReport } = require(join(outputDir, "audit-v2", "build-report.js"));

  const parsed = await pdfParse(readFileSync(pdfPath), {
    pagerender: async (page) => {
      const text = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
      return `\n[PDF_PAGE ${page.pageIndex + 1}]\n${text.items.map((item) => item.str || "").join(" ")}\n`;
    },
  });
  const seed = buildFastTextData(parsed.text, basename(pdfPath));
  if (!seed || !hasFastTextCoverage(seed)) throw new Error("Fast-text coverage gate did not pass.");

  const data = normalizeExtractedData(seed, basename(pdfPath));
  const findings = verifyFindings(runDeterministicRules(data));
  const rules = new Set(findings.map((finding) => finding.ruleId));
  const missingRules = [...expectedRules].filter((rule) => !rules.has(rule));
  if (missingRules.length) throw new Error(`Fast-text smoke missed rules: ${missingRules.join(", ")}`);

  const report = buildLegacyReport(
    {
      analysisVersion: "3.0",
      analysisPath: "fast_text",
      extractedData: data,
      findings,
      metrics: scoreFindings(findings),
      executiveSummary: "Synthetic fast-text smoke report.",
      cfoSummary: "Synthetic fast-text smoke report.",
      reasoningThemes: [],
      recommendedActions: [],
    },
    { fileName: basename(pdfPath), financialText: parsed.text }
  );
  if (report.report_quality.analysis_path !== "fast_text") {
    throw new Error(`Fast-text metadata path was not persisted: ${report.report_quality.analysis_path}`);
  }
  if (report.report_quality.extracted_record_count <= 0) {
    throw new Error("Fast-text metadata did not include extracted record count.");
  }
  if (report.report_quality.verified_finding_count !== findings.length) {
    throw new Error("Fast-text metadata did not include verified finding count.");
  }

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > 30_000) throw new Error(`Fast-text path exceeded the 30-second SLA: ${elapsedMs}ms`);
  console.log(JSON.stringify({
    status: "passed",
    elapsedMs,
    elapsedSeconds: Number((elapsedMs / 1000).toFixed(2)),
    findingCount: findings.length,
    ruleCount: rules.size,
    reportQuality: report.report_quality,
    metrics: scoreFindings(findings),
    extractedCounts: Object.fromEntries(Object.entries(data).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])),
  }, null, 2));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
