import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputDir = mkdtempSync(join(tmpdir(), "effluxa-audit-v3-routing-"));

try {
  execFileSync("npx", [
    "tsc",
    "src/lib/audit-v2/extractor.ts",
    "src/lib/audit-v3/routing.ts",
    "--module", "commonjs",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--outDir", outputDir,
    "--incremental", "false",
  ], { cwd: root, stdio: "inherit" });

  const require = createRequire(import.meta.url);
  const { getV3RoutingStats, routeFinancialTextV3 } = require(join(outputDir, "audit-v3", "routing.js"));
  const pdfParse = require(join(root, "node_modules/pdf-parse"));
  const pdfPath = "/Users/boskovasiljevic/Downloads/Effluxa_Complex_Financial_Stress_Test.pdf";
  const parsed = await pdfParse(readFileSync(pdfPath), {
    pagerender: async (page) => {
      const text = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
      return `\n[PDF_PAGE ${page.pageIndex + 1}]\n${text.items.map((item) => item.str || "").join(" ")}\n`;
    },
  });

  const stats = getV3RoutingStats(parsed.text);
  const invoiceText = routeFinancialTextV3("invoice-ledger", parsed.text);
  const financeText = routeFinancialTextV3("financing-and-related-parties", parsed.text);

  if (stats.pageCount !== 30) throw new Error(`Expected 30 pages, got ${stats.pageCount}`);
  if (stats.routedChars >= stats.fullTextChars * 5 * 0.7) {
    throw new Error(`Routing did not reduce repeated input enough: ${JSON.stringify(stats)}`);
  }
  if (!invoiceText.includes("[PDF_PAGE 13]") || !invoiceText.includes("[PDF_PAGE 16]")) {
    throw new Error("Invoice pass lost the AP ledger continuation pages.");
  }
  if (!financeText.includes("[PDF_PAGE 25]") || !financeText.includes("[PDF_PAGE 28]")) {
    throw new Error("Financing pass lost debt or related-party pages.");
  }

  console.log(JSON.stringify({ status: "passed", stats }, null, 2));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
