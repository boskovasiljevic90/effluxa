import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function parseEnv(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function updateEnv(content, values) {
  let next = content.trimEnd();

  for (const [key, value] of Object.entries(values)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${escapedKey}=.*$`, "m");
    const line = `${key}="${value}"`;

    if (pattern.test(next)) {
      next = next.replace(pattern, line);
    } else {
      next += `\n${line}`;
    }
  }

  return `${next}\n`;
}

const envContent = fs.readFileSync(envPath, "utf8");
const env = parseEnv(envContent);

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY nije pronađen u .env.local.");
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const isTestMode = env.STRIPE_SECRET_KEY.startsWith("sk_test_");

console.log(
  `Stripe režim: ${isTestMode ? "TEST" : "LIVE"}`
);

if (!isTestMode) {
  console.log("");
  console.log("⚠️  Detektovan je LIVE Stripe ključ.");
  console.log("Ovaj skript bi napravio LIVE proizvode i cene.");
  console.log("Zaštitno zaustavljanje.");
  console.log("");
  console.log(
    "Za namerno kreiranje LIVE cena pokreni:"
  );
  console.log(
    "EFFLUXA_ALLOW_LIVE_STRIPE=1 node scripts/setup-stripe-pricing.mjs"
  );

  if (process.env.EFFLUXA_ALLOW_LIVE_STRIPE !== "1") {
    process.exit(2);
  }
}

const catalog = [
  {
    envKey: "STRIPE_FULL_AUDIT_PRICE_ID",
    productName: "Effluxa Full AI Audit",
    productDescription:
      "One complete Effluxa AI financial leakage audit.",
    lookupKey: "effluxa_full_audit_eur_99",
    unitAmount: 9900,
    recurring: null,
  },
  {
    envKey: "STRIPE_PRO_MONTHLY_PRICE_ID",
    productName: "Effluxa Pro",
    productDescription:
      "Unlimited personal audits, monthly re-runs and trend tracking.",
    lookupKey: "effluxa_pro_monthly_eur_79",
    unitAmount: 7900,
    recurring: {
      interval: "month",
      interval_count: 1,
    },
  },
  {
    envKey: "STRIPE_PRO_ANNUAL_PRICE_ID",
    productName: "Effluxa Pro",
    productDescription:
      "Annual Effluxa Pro subscription with approximately two months free.",
    lookupKey: "effluxa_pro_annual_eur_790",
    unitAmount: 79000,
    recurring: {
      interval: "year",
      interval_count: 1,
    },
  },
  {
    envKey: "STRIPE_AGENCY_MONTHLY_PRICE_ID",
    productName: "Effluxa Agency",
    productDescription:
      "Up to 15 client portfolios, team seats and white-label reporting.",
    lookupKey: "effluxa_agency_monthly_eur_299",
    unitAmount: 29900,
    recurring: {
      interval: "month",
      interval_count: 1,
    },
  },
  {
    envKey: "STRIPE_AGENCY_ANNUAL_PRICE_ID",
    productName: "Effluxa Agency",
    productDescription:
      "Annual Effluxa Agency subscription with approximately two months free.",
    lookupKey: "effluxa_agency_annual_eur_2990",
    unitAmount: 299000,
    recurring: {
      interval: "year",
      interval_count: 1,
    },
  },
];

async function findPriceByLookupKey(lookupKey) {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 10,
    expand: ["data.product"],
  });

  return prices.data[0] ?? null;
}

async function findOrCreateProduct(name, description) {
  const products = await stripe.products.search({
    query: `name:'${name.replaceAll("'", "\\'")}'`,
    limit: 20,
  });

  const exact = products.data.find(
    (product) => product.name === name && product.active
  );

  if (exact) {
    return exact;
  }

  return stripe.products.create({
    name,
    description,
    metadata: {
      application: "effluxa",
      catalogVersion: "v2",
    },
  });
}

async function findOrCreatePrice(item) {
  const existingPrice = await findPriceByLookupKey(
    item.lookupKey
  );

  if (existingPrice) {
    if (
      existingPrice.currency !== "eur" ||
      existingPrice.unit_amount !== item.unitAmount
    ) {
      throw new Error(
        `Lookup key ${item.lookupKey} postoji, ali cena ne odgovara očekivanoj vrednosti.`
      );
    }

    console.log(
      `✓ Postojeća cena: ${item.lookupKey} → ${existingPrice.id}`
    );

    return existingPrice;
  }

  const product = await findOrCreateProduct(
    item.productName,
    item.productDescription
  );

  const payload = {
    product: product.id,
    currency: "eur",
    unit_amount: item.unitAmount,
    lookup_key: item.lookupKey,
    metadata: {
      application: "effluxa",
      catalogVersion: "v2",
    },
  };

  if (item.recurring) {
    payload.recurring = item.recurring;
  }

  const price = await stripe.prices.create(payload);

  console.log(
    `✓ Kreirana cena: ${item.lookupKey} → ${price.id}`
  );

  return price;
}

const created = {};

for (const item of catalog) {
  const price = await findOrCreatePrice(item);
  created[item.envKey] = price.id;
}

/*
 * Zadržavamo kompatibilnost sa postojećom aplikacijom:
 * STRIPE_PRICE_ID sada pokazuje na novi €99 jednokratni audit.
 *
 * Stari STRIPE_BUSINESS_PRICE_ID se namerno ne menja.
 * On ostaje vezan za grandfathered Business pretplate dok
 * ne završimo aplikacionu migraciju.
 */
created.STRIPE_PRICE_ID =
  created.STRIPE_FULL_AUDIT_PRICE_ID;

const updatedEnv = updateEnv(envContent, created);

fs.writeFileSync(envPath, updatedEnv, {
  encoding: "utf8",
  mode: 0o600,
});

console.log("");
console.log("================================================");
console.log(" STRIPE CATALOG READY");
console.log("================================================");

for (const [key, value] of Object.entries(created)) {
  console.log(`${key}=${value}`);
}

console.log("");
console.log("✅ .env.local je ažuriran.");
console.log("✅ Postojeći STRIPE_BUSINESS_PRICE_ID nije promenjen.");
console.log(
  "✅ Existing Business pretplatnici ostaju grandfathered."
);
