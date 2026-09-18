import { execFileSync } from "node:child_process";
import { createRequire, Module } from "node:module";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pdfPath = process.argv[2] || "/Users/boskovasiljevic/Downloads/Effluxa_Complex_Financial_Stress_Test.pdf";
const outputPath = process.argv[3] || "/private/tmp/effluxa-v3-benchmark-current.json";

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function collectTsFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTsFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

loadEnv(join(root, ".env"));
loadEnv(join(root, ".env.local"));
process.env.EFFLUXA_AUDIT_V2_REASONING = "false";
process.env.EFFLUXA_AUDIT_V2_DEBUG = "true";

if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured for the benchmark run.");
if (!existsSync(pdfPath)) throw new Error(`Benchmark PDF not found: ${pdfPath}`);

const outputDir = mkdtempSync(join(tmpdir(), "effluxa-audit-v3-benchmark-"));
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

  process.env.NODE_PATH = join(root, "node_modules");
  Module._initPaths();
  const require = createRequire(import.meta.url);
  const { analyzeAuditV3 } = require(join(outputDir, "audit-v3", "index.js"));
  const pdfParse = require(join(root, "node_modules/pdf-parse"));
  const bytes = readFileSync(pdfPath);
  const file = new File([bytes], basename(pdfPath), { type: "application/pdf" });
  const parsedPdf = await pdfParse(bytes, {
    pagerender: async (page) => {
      const text = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
      return `\n[PDF_PAGE ${page.pageIndex + 1}]\n${text.items.map((item) => item.str || "").join(" ")}\n`;
    },
  });
  const report = await analyzeAuditV3({ file, fileName: basename(pdfPath), financialText: parsedPdf.text, language: "English" });
  const elapsedMs = Date.now() - startedAt;
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    status: "completed",
    outputPath,
    elapsedMs,
    elapsedSeconds: Number((elapsedMs / 1000).toFixed(2)),
    analysisVersion: report.analysisVersion,
    analysisPath: report.report_quality?.analysis_path || null,
    extractedRecordCount: report.report_quality?.extracted_record_count || 0,
    verifiedFindingCount: report.report_quality?.verified_finding_count || 0,
    findingCount: report.findings?.length || 0,
    rules: [...new Set((report.findings || []).map((finding) => finding.ruleId))],
    metrics: report.metrics,
    extractedCounts: Object.fromEntries(Object.entries(report.extractedData || {}).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])),
  }, null, 2));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
