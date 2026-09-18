import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputDir = mkdtempSync(join(tmpdir(), "effluxa-pilot-lead-metrics-"));

try {
  execFileSync("npx", [
    "tsc",
    "src/lib/pilotLeadMetrics.ts",
    "--module", "commonjs",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--outDir", outputDir,
    "--incremental", "false",
  ], { cwd: root, stdio: "inherit" });

  const require = createRequire(import.meta.url);
  const { buildPilotLeadFunnel } = require(join(outputDir, "pilotLeadMetrics.js"));

  const result = buildPilotLeadFunnel(
    [
      { email: " Lead@Example.com ", createdAt: "2026-09-01T09:00:00.000Z" },
      { email: "lead@example.com", createdAt: "2026-09-02T09:00:00.000Z" },
      { email: "older@example.com", createdAt: "2026-09-03T09:00:00.000Z" },
      { email: "late@example.com", createdAt: "2026-09-04T09:00:00.000Z" },
      { email: "noaudit@example.com", createdAt: "2026-09-05T09:00:00.000Z" },
      { email: "   ", createdAt: "2026-09-06T09:00:00.000Z" },
    ],
    [
      { email: "lead@example.com", createdAt: "2026-09-02T10:00:00.000Z", isPaid: true },
      { email: "older@example.com", createdAt: "2026-08-01T10:00:00.000Z", isPaid: true },
      { email: "late@example.com", createdAt: "2026-09-05T10:00:00.000Z", isPaid: false },
      { email: "noaudit@example.com", createdAt: "2026-09-06T10:00:00.000Z", isPaid: false },
    ],
    [
      { email: "lead@example.com", createdAt: "2026-09-08T10:00:00.000Z" },
      { email: "late@example.com", createdAt: "2026-09-14T10:00:00.000Z" },
    ]
  );

  assert.deepEqual(result, {
    totalLeads: 4,
    leadsWithoutSignup: 1,
    leadsWithSignup: 3,
    activatedWithin7Days: 1,
    paidAccounts: 1,
    signupRate: 75,
    activationRate: 33,
    paidRate: 33,
  });

  console.log(JSON.stringify({ status: "passed", result }, null, 2));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
