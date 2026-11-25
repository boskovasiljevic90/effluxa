#!/usr/bin/env node
/**
 * Fails the build when a displayed price drifts from the price list.
 *
 * Checkout and the marketing copy previously diverged: the dashboard showed
 * EUR 79 while Paddle charged EUR 99. Prices now live in one module and this
 * check makes any stale literal a build error.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SCOPE = [
  "src/app/dashboard",
  "src/app/instant",
  "src/app/tools",
  "src/app/partners",
  "src/app/checkout",
  "src/app/billing",
  "src/app/security",
  "src/components",
  "src/app/page.tsx",
  "src/lib/effluxaProductKnowledge.ts",
];

// Non-price amounts that are allowed to appear in UI copy.
const EXTRA_ALLOWED = new Set([0, 199, 18.7]); // free tier, partner wholesale, illustrative sample

const displaySource = readFileSync(join(ROOT, "src/lib/pricingDisplay.ts"), "utf8");
const allowed = new Set(EXTRA_ALLOWED);
for (const match of displaySource.matchAll(/(\w+):\s*(\d+)/g)) {
  allowed.add(Number(match[2]));
}

function walk(path, files = []) {
  const full = join(ROOT, path);
  let info;
  try {
    info = statSync(full);
  } catch {
    return files;
  }
  if (info.isFile()) {
    files.push(path);
    return files;
  }
  for (const entry of readdirSync(full)) {
    if (entry.startsWith(".")) continue;
    walk(join(path, entry), files);
  }
  return files;
}

const files = SCOPE.flatMap((path) => walk(path)).filter((file) => /\.(tsx?|jsx?)$/.test(file));
const problems = [];

for (const file of files) {
  const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const match of line.matchAll(/€\s?([\d][\d.,]*)/g)) {
      const raw = match[1].replace(/,/g, "");
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      if (!allowed.has(value)) {
        problems.push(`${file}:${index + 1} shows €${match[1]} but the price list has ${[...allowed].join(", ")}`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error("Price copy does not match the price list:\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`\nAllowed display amounts: ${[...allowed].sort((a, b) => a - b).join(", ")}`);
  process.exit(1);
}

console.log(`Price copy check passed (${files.length} files, allowed: ${[...allowed].sort((a, b) => a - b).join(", ")}).`);
