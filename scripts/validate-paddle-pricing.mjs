import fs from "node:fs";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const requiredPrices = {
  PADDLE_FULL_AUDIT_PRICE_ID: "full_audit",
  PADDLE_PRO_MONTHLY_PRICE_ID: "pro_monthly",
  PADDLE_PRO_ANNUAL_PRICE_ID: "pro_annual",
  PADDLE_AGENCY_MONTHLY_PRICE_ID: "agency_monthly",
  PADDLE_AGENCY_ANNUAL_PRICE_ID: "agency_annual",
};

let failed = false;

function check(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ${message}`);
    failed = true;
  }
}

console.log("EFFLUXA PADDLE PRICING VALIDATION");
console.log("=================================");

check(Boolean(process.env.PADDLE_API_KEY), "PADDLE_API_KEY is configured");
check(Boolean(process.env.PADDLE_WEBHOOK_SECRET), "PADDLE_WEBHOOK_SECRET is configured");
check(Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN), "Paddle client token is configured");
check(
  process.env.PADDLE_ENVIRONMENT === "sandbox" || process.env.PADDLE_ENVIRONMENT === "production",
  "PADDLE_ENVIRONMENT is sandbox or production",
);
check(
  process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === process.env.PADDLE_ENVIRONMENT,
  "Frontend and backend Paddle environments match",
);

for (const [envKey, plan] of Object.entries(requiredPrices)) {
  const priceId = process.env[envKey];
  check(Boolean(priceId?.startsWith("pri_")), `${plan} uses a Paddle price ID`);
}

const contractFiles = [
  "src/app/api/paddle/create-checkout-session/route.ts",
  "src/app/api/paddle/create-subscription/route.ts",
  "src/app/api/paddle/create-billing-portal/route.ts",
  "src/app/api/paddle/webhook/route.ts",
  "src/app/checkout/page.tsx",
];

for (const file of contractFiles) {
  check(fs.existsSync(file), `${file} exists`);
}

const sourceFiles = [
  "src/app/api/paddle/create-checkout-session/route.ts",
  "src/app/api/paddle/create-subscription/route.ts",
  "src/app/api/paddle/create-billing-portal/route.ts",
  "src/app/api/paddle/webhook/route.ts",
  "src/app/checkout/page.tsx",
];

for (const file of sourceFiles) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  check(!/stripe|STRIPE|checkoutSessionId/i.test(source), `${file} contains no Stripe contract`);
}

if (process.env.PADDLE_API_KEY && process.env.PADDLE_VALIDATE_API !== "false") {
  try {
    const paddle = new Paddle(process.env.PADDLE_API_KEY, {
      environment:
        process.env.PADDLE_ENVIRONMENT === "sandbox"
          ? Environment.sandbox
          : Environment.production,
    });

    for (const [envKey, plan] of Object.entries(requiredPrices)) {
      const priceId = process.env[envKey];
      if (!priceId) continue;
      const price = await paddle.prices.get(priceId);
      check(price.status === "active", `${plan} Paddle price is active`);
    }
  } catch (error) {
    console.error("❌ Paddle API price validation failed:", error?.message || error);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("✅ Paddle pricing validation passed");
