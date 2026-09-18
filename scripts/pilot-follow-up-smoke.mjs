import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputDir = mkdtempSync(join(tmpdir(), "effluxa-pilot-follow-up-"));

try {
  execFileSync("npx", [
    "tsc",
    "src/lib/pilotFollowUp.ts",
    "--module", "commonjs",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--outDir", outputDir,
    "--incremental", "false",
  ], { cwd: root, stdio: "inherit" });

  const require = createRequire(import.meta.url);
  const { buildPilotFollowUpDraft } = require(join(outputDir, "pilotFollowUp.js"));
  const draft = buildPilotFollowUpDraft({
    name: "Alex",
    signupUrl: "https://www.effluxa.com/signup?source=pilot",
  });

  assert.match(draft, /^Hi Alex,/);
  assert.match(draft, /https:\/\/www\.effluxa\.com\/signup\?source=pilot/);
  assert.match(draft, /client-approved, redacted/);
  assert.match(draft, /do not send unredacted financial documents/);
  assert.match(buildPilotFollowUpDraft({ name: "   " }), /^Hi there,/);

  console.log(JSON.stringify({ status: "passed", length: draft.length }, null, 2));
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
