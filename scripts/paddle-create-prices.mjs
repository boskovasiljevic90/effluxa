#!/usr/bin/env node
/**
 * Creates the 2026 Effluxa price list in Paddle and prints the price IDs.
 *
 * Usage:
 *   PADDLE_API_KEY=pdl_live_apikey_... node scripts/paddle-create-prices.mjs          # dry run
 *   PADDLE_API_KEY=pdl_live_apikey_... node scripts/paddle-create-prices.mjs --apply  # create
 *
 * Amounts are in the lowest denomination: EUR cents (149 EUR = 14900).
 */

const KEY = process.env.PADDLE_API_KEY || "";
const APPLY = process.argv.includes("--apply");
const isSandbox = KEY.startsWith("pdl_sdbx");
const BASE = isSandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

const TARGETS = [
  { key: "FULL_AUDIT", product: /full\s*audit|audit/i, amount: 14900, interval: null, name: "Full AI Audit 149 EUR" },
  { key: "PRO_MONTHLY", product: /pro/i, amount: 9900, interval: "month", name: "Pro Monthly 99 EUR" },
  { key: "PRO_ANNUAL", product: /pro/i, amount: 99000, interval: "year", name: "Pro Annual 990 EUR" },
  { key: "AGENCY_MONTHLY", product: /agency|business|firm/i, amount: 39900, interval: "month", name: "Agency Monthly 399 EUR" },
  { key: "AGENCY_ANNUAL", product: /agency|business|firm/i, amount: 399000, interval: "year", name: "Agency Annual 3990 EUR" },
];

if (!KEY) {
  console.error("Missing PADDLE_API_KEY.");
  process.exit(1);
}

async function api(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} -> ${response.status}: ${JSON.stringify(body?.error || body)}`);
  }
  return body;
}

async function listAll(path) {
  const items = [];
  let after = null;
  for (let page = 0; page < 20; page += 1) {
    const query = `${path}${path.includes("?") ? "&" : "?"}per_page=200${after ? `&after=${after}` : ""}`;
    const data = await api(query);
    items.push(...(data.data || []));
    after = data?.meta?.pagination?.has_more ? data?.meta?.pagination?.next : null;
    if (!after) break;
  }
  return items;
}

console.log(`Paddle environment: ${isSandbox ? "SANDBOX" : "PRODUCTION"} | mode: ${APPLY ? "APPLY" : "DRY RUN"}`);

const products = await listAll("/products");
if (products.length === 0) throw new Error("No products found in this Paddle account.");

console.log(`\nProducts found (${products.length}):`);
for (const product of products) console.log(`  ${product.id}  ${product.name}`);

const prices = await listAll("/prices");
console.log(`\nExisting prices: ${prices.length}`);

const results = [];

for (const target of TARGETS) {
  const product = products.find((item) => target.product.test(item.name));
  if (!product) {
    results.push({ ...target, error: "no matching product" });
    continue;
  }

  const existing = prices.find((price) => {
    if (price.product_id !== product.id) return false;
    if (price.unit_price?.amount !== target.amount) return false;
    if ((price.unit_price?.currency_code || "").toUpperCase() !== "EUR") return false;
    const interval = price.billing_cycle?.interval || null;
    return interval === target.interval;
  });

  if (existing) {
    results.push({ ...target, productId: product.id, priceId: existing.id, status: "exists" });
    continue;
  }

  const payload = {
    product_id: product.id,
    description: target.name,
    name: target.name,
    unit_price: { amount: String(target.amount), currency_code: "EUR" },
    ...(target.interval
      ? { billing_cycle: { interval: target.interval, frequency: 1 }, trial_period: null }
      : { billing_cycle: null }),
  };

  if (!APPLY) {
    results.push({ ...target, productId: product.id, status: "would_create", payload });
    continue;
  }

  const created = await api("/prices", { method: "POST", body: JSON.stringify(payload) });
  results.push({ ...target, productId: product.id, priceId: created.data.id, status: "created" });
}

console.log("\nResult:");
for (const row of results) {
  console.log(`  ${row.key.padEnd(15)} ${row.status.padEnd(12)} ${row.priceId || row.error || ""}  (${row.name})`);
}

const envLines = results
  .filter((row) => row.priceId)
  .map((row) => `PADDLE_${row.key}_PRICE_ID=${row.priceId}`);

if (envLines.length > 0) {
  console.log("\nEnvironment values:");
  for (const line of envLines) console.log(line);
}

const failed = results.filter((row) => !row.priceId);
if (failed.length > 0) {
  console.error(`\n${failed.length} target(s) not resolved. Fix the product names or create the product first.`);
  process.exit(2);
}
