import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputDir = mkdtempSync(join(tmpdir(), "effluxa-pilot-lead-triage-"));

try {
  execFileSync("npx", [
    "tsc",
    "src/lib/pilotLeadTriage.ts",
    "--module", "commonjs",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--outDir", outputDir,
    "--incremental", "false",
  ], { cwd: root, stdio: "inherit" });

  const require = createRequire(import.meta.url);
  const { buildPilotLeadTriage } = require(join(outputDir, "pilotLeadTriage.js"));

  const high = buildPilotLeadTriage({
    role: "accounting_bookkeeping",
    portfolioSize: "21_50",
    focus: "recurring_spend",
    canProvideRedactedFile: true,
  });
  assert.equal(high.score, 10);
  assert.equal(high.tier, "HIGH");

  const medium = buildPilotLeadTriage({
    role: "fractional_cfo",
    portfolioSize: "6_20",
    focus: "cash_flow",
    canProvideRedactedFile: false,
  });
  assert.equal(medium.score, 7);
  assert.equal(medium.tier, "MEDIUM");

  const low = buildPilotLeadTriage({
    role: "in_house_finance",
    portfolioSize: "1_5",
    focus: "not_sure",
    canProvideRedactedFile: false,
  });
  assert.equal(low.score, 3);
  assert.equal(low.tier, "LOW");

  const incomplete = buildPilotLeadTriage(null);
  assert.deepEqual(incomplete, {
    score: 0,
    maxScore: 11,
    tier: "LOW",
    rationale: ["Pilot profile is incomplete"],
  });

  console.log(JSON.stringify({
    status: "passed",
    high,
    medium,
    low,
    incomplete,
  }, null, 2));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
