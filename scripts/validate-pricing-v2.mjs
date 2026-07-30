import fs from "fs";
import Stripe from "stripe";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) continue;

    const key = match[1];

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const requiredPrices = [
  {
    env: "STRIPE_FULL_AUDIT_PRICE_ID",
    amount: 9900,
    currency: "eur",
    recurring: null,
  },
  {
    env: "STRIPE_PRO_MONTHLY_PRICE_ID",
    amount: 7900,
    currency: "eur",
    recurring: "month",
  },
  {
    env: "STRIPE_PRO_ANNUAL_PRICE_ID",
    amount: 79000,
    currency: "eur",
    recurring: "year",
  },
  {
    env: "STRIPE_AGENCY_MONTHLY_PRICE_ID",
    amount: 29900,
    currency: "eur",
    recurring: "month",
  },
  {
    env: "STRIPE_AGENCY_ANNUAL_PRICE_ID",
    amount: 299000,
    currency: "eur",
    recurring: "year",
  },
];

const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
    console.log(`❌ ${message}`);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log("================================================");
console.log(" EFFLUXA V2 STRIPE PRICE VALIDATION");
console.log("================================================");

check(Boolean(process.env.STRIPE_SECRET_KEY), "STRIPE_SECRET_KEY is configured");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

for (const item of requiredPrices) {
  const priceId = process.env[item.env];

  check(Boolean(priceId), `${item.env} is configured`);

  if (!priceId) continue;

  const price = await stripe.prices.retrieve(priceId);

  check(
    price.unit_amount === item.amount,
    `${item.env} amount is ${item.amount}`
  );

  check(
    price.currency === item.currency,
    `${item.env} currency is ${item.currency}`
  );

  const interval = price.recurring?.interval || null;

  check(
    interval === item.recurring,
    `${item.env} recurring interval is ${item.recurring ?? "one-time"}`
  );
}

check(
  process.env.STRIPE_PRICE_ID === process.env.STRIPE_FULL_AUDIT_PRICE_ID,
  "STRIPE_PRICE_ID points to STRIPE_FULL_AUDIT_PRICE_ID"
);

console.log("");
console.log("================================================");
console.log(" SOURCE CONTRACT VALIDATION");
console.log("================================================");

const sourceFiles = [
  "src/app/api/stripe/create-checkout-session/route.ts",
  "src/app/api/stripe/create-subscription/route.ts",
  "src/app/api/stripe/webhook/route.ts",
  "src/app/dashboard/BusinessUpgradeButton.tsx",
  "src/app/page.tsx",
];

for (const file of sourceFiles) {
  check(fs.existsSync(file), `${file} exists`);
}

const checkout =
  fs.existsSync("src/app/api/stripe/create-checkout-session/route.ts")
    ? fs.readFileSync("src/app/api/stripe/create-checkout-session/route.ts", "utf8")
    : "";

check(
  checkout.includes("STRIPE_FULL_AUDIT_PRICE_ID"),
  "Full audit checkout uses STRIPE_FULL_AUDIT_PRICE_ID"
);

check(
  checkout.includes('product: "full_audit_unlock"'),
  "Full audit checkout uses full_audit_unlock metadata"
);

check(
  !checkout.includes("price_data"),
  "Full audit checkout no longer uses inline price_data"
);

check(
  !checkout.includes("unit_amount"),
  "Full audit checkout no longer hardcodes unit_amount"
);

const subscription =
  fs.existsSync("src/app/api/stripe/create-subscription/route.ts")
    ? fs.readFileSync("src/app/api/stripe/create-subscription/route.ts", "utf8")
    : "";

for (const plan of [
  "pro_monthly",
  "pro_annual",
  "agency_monthly",
  "agency_annual",
]) {
  check(subscription.includes(plan), `Subscription endpoint supports ${plan}`);
}

for (const env of [
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_ANNUAL_PRICE_ID",
  "STRIPE_AGENCY_MONTHLY_PRICE_ID",
  "STRIPE_AGENCY_ANNUAL_PRICE_ID",
]) {
  check(subscription.includes(env), `Subscription endpoint references ${env}`);
}

const webhook =
  fs.existsSync("src/app/api/stripe/webhook/route.ts")
    ? fs.readFileSync("src/app/api/stripe/webhook/route.ts", "utf8")
    : "";

for (const token of [
  "full_audit_unlock",
  "pro_subscription",
  "agency_subscription",
  "business_subscription",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]) {
  check(webhook.includes(token), `Webhook supports ${token}`);
}

const button =
  fs.existsSync("src/app/dashboard/BusinessUpgradeButton.tsx")
    ? fs.readFileSync("src/app/dashboard/BusinessUpgradeButton.tsx", "utf8")
    : "";

check(
  button.includes("/api/stripe/create-subscription") ||
    button.includes("SubscriptionButton"),
  "Dashboard upgrade button uses new subscription flow"
);

check(
  !button.includes("create-business-subscription"),
  "Dashboard upgrade button no longer calls legacy business route"
);

const pricePatternFailures = [];

for (const file of sourceFiles) {
  if (!fs.existsSync(file)) continue;

  const text = fs.readFileSync(file, "utf8");

  if (/€29(?!9|0)/.test(text)) {
    pricePatternFailures.push(`${file}: exact old €29 reference`);
  }

  if (/€44\.99/.test(text)) {
    pricePatternFailures.push(`${file}: old €44.99 reference`);
  }

  if (/(?<!\d)2900(?!\d)/.test(text)) {
    pricePatternFailures.push(`${file}: old 2900 cent reference`);
  }
}

check(
  pricePatternFailures.length === 0,
  "No exact old pricing references in checked source files"
);

for (const item of pricePatternFailures) {
  console.log(`❌ ${item}`);
}

if (failures.length > 0) {
  console.log("");
  console.log("================================================");
  console.log(" VALIDATION FAILED");
  console.log("================================================");
  process.exitCode = 1;
} else {
  console.log("");
  console.log("================================================");
  console.log(" VALIDATION PASSED");
  console.log("================================================");
}
