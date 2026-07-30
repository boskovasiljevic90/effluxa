import fs from "fs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

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
    process.env[key] = value;
  }
}

/*
 * Match local Next test server:
 * .env first, .env.local overrides.
 */
loadEnvFile(".env");
loadEnvFile(".env.local");

const prisma = new PrismaClient();

const requiredEnv = [
  "DATABASE_URL",
  "JWT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_FULL_AUDIT_PRICE_ID",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
  "STRIPE_PRO_ANNUAL_PRICE_ID",
  "STRIPE_AGENCY_MONTHLY_PRICE_ID",
  "STRIPE_AGENCY_ANNUAL_PRICE_ID",
];

const failures = [];

function pass(message) {
  console.log(`✅ ${message}`);
}

function fail(message) {
  failures.push(message);
  console.log(`❌ ${message}`);
}


function check(condition, message) {
  if (condition) {
    pass(message);
  } else {
    fail(message);
  }
}

for (const key of requiredEnv) {
  check(Boolean(process.env[key]), `${key} is configured`);
}

if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  fail("STRIPE_SECRET_KEY is not a test key. Aborting matrix for safety.");
}

if (failures.length > 0) {
  await prisma.$disconnect();
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


const appUrl = "http://localhost:3000";

const matrixId = Date.now();

const testEmail = `pricing-matrix-${matrixId}@effluxa.test`;

let testUser = null;
let testReport = null;

async function postJson(path, body, token) {
  const response = await fetch(`${appUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `token=${token}`,
    },
    body: JSON.stringify(body),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      `${path} returned ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

function extractCheckoutSessionId(url) {
  const match = String(url).match(/cs_(test|live)_[A-Za-z0-9]+/);

  if (!match) {
    throw new Error(`Could not extract checkout session id from URL: ${url}`);
  }

  return match[0];
}

async function getCheckoutPriceId(sessionId) {
  const items = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 1,
  });

  const first = items.data[0];

  if (!first?.price?.id) {
    throw new Error(`No line item price found for session ${sessionId}`);
  }

  return first.price.id;
}

async function sendWebhook(event) {
  const payload = JSON.stringify(event);

  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });

  const response = await fetch(`${appUrl}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Webhook ${event.type} failed with ${response.status}: ${text}`
    );
  }

  return text;
}

async function refreshUser() {
  return prisma.user.findUnique({
    where: {
      id: testUser.id,
    },
  });
}

async function refreshReport() {
  return prisma.upload.findUnique({
    where: {
      id: testReport.id,
    },
  });
}

try {
  console.log("");
  console.log("================================================");
  console.log(" CREATE TEST USER + REPORT");
  console.log("================================================");

  testUser = await prisma.user.create({
    data: {
      email: testEmail,
      password: "pricing-matrix-test-user-no-login",
      role: "FREE",
      subscriptionStatus: "inactive",
    },
  });

  testReport = await prisma.upload.create({
    data: {
      userId: testUser.id,
      fileUrl: `pricing-matrix-${matrixId}.csv`,
      parsedData: {
        executive_summary: "Pricing matrix test report.",
        leakage_score: 42,
        estimated_savings: 1200,
        quick_wins: ["Matrix test quick win"],
        recommendations: ["Matrix test recommendation"],
      },
      unlocked: false,
    },
  });

  pass(`Created test user ${testUser.email}`);
  pass(`Created test report ${testReport.id}`);

  const token = jwt.sign(
    {
      userId: testUser.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  console.log("");
  console.log("================================================");
  console.log(" CHECKOUT ENDPOINT MATRIX");
  console.log("================================================");

  const fullAuditResponse = await postJson(
    "/api/stripe/create-checkout-session",
    {
      reportId: testReport.id,
    },
    token
  );

  check(Boolean(fullAuditResponse.url), "Full Audit checkout returned URL");

  const fullAuditSessionId = extractCheckoutSessionId(fullAuditResponse.url);
  const fullAuditSession =
    await stripe.checkout.sessions.retrieve(fullAuditSessionId);

  check(fullAuditSession.mode === "payment", "Full Audit session mode is payment");
  check(
    fullAuditSession.metadata?.product === "full_audit_unlock",
    "Full Audit session product metadata is full_audit_unlock"
  );
  check(
    fullAuditSession.metadata?.reportId === testReport.id,
    "Full Audit session has reportId metadata"
  );

  const fullAuditPriceId =
    await getCheckoutPriceId(fullAuditSessionId);

  check(
    fullAuditPriceId === process.env.STRIPE_FULL_AUDIT_PRICE_ID,
    "Full Audit checkout uses STRIPE_FULL_AUDIT_PRICE_ID"
  );

  const subscriptionPlans = [
    {
      plan: "pro_monthly",
      expectedPrice: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      expectedProduct: "pro_subscription",
    },
    {
      plan: "pro_annual",
      expectedPrice: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
      expectedProduct: "pro_subscription",
    },
    {
      plan: "agency_monthly",
      expectedPrice: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
      expectedProduct: "agency_subscription",
    },
    {
      plan: "agency_annual",
      expectedPrice: process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID,
      expectedProduct: "agency_subscription",
    },
  ];

  for (const item of subscriptionPlans) {
    const response = await postJson(
      "/api/stripe/create-subscription",
      {
        plan: item.plan,
      },
      token
    );

    check(Boolean(response.url), `${item.plan} checkout returned URL`);

    const sessionId = extractCheckoutSessionId(response.url);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    check(session.mode === "subscription", `${item.plan} session mode is subscription`);
    check(session.metadata?.plan === item.plan, `${item.plan} session plan metadata is correct`);
    check(
      session.metadata?.product === item.expectedProduct,
      `${item.plan} product metadata is ${item.expectedProduct}`
    );

    const priceId = await getCheckoutPriceId(sessionId);

    check(
      priceId === item.expectedPrice,
      `${item.plan} uses expected Stripe Price ID`
    );
  }

  console.log("");
  console.log("================================================");
  console.log(" WEBHOOK MATRIX");
  console.log("================================================");

  await sendWebhook({
    id: `evt_matrix_full_audit_${matrixId}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_matrix_full_audit_${matrixId}`,
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        status: "complete",
        customer: `cus_matrix_${matrixId}`,
        subscription: null,
        metadata: {
          userId: testUser.id,
          reportId: testReport.id,
          product: "full_audit_unlock",
          plan: "full_audit",
        },
      },
    },
  });

  let reportAfterFullAudit = await refreshReport();

  check(
    reportAfterFullAudit?.unlocked === true,
    "Webhook unlocks Full Audit report"
  );

  await sendWebhook({
    id: `evt_matrix_pro_${matrixId}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_matrix_pro_${matrixId}`,
        object: "checkout.session",
        mode: "subscription",
        payment_status: "paid",
        status: "complete",
        customer: `cus_matrix_${matrixId}`,
        subscription: `sub_matrix_pro_${matrixId}`,
        metadata: {
          userId: testUser.id,
          product: "pro_subscription",
          plan: "pro_monthly",
        },
      },
    },
  });

  let userAfterPro = await refreshUser();

  check(userAfterPro?.role === "PRO", "Webhook activates PRO role");
  check(
    userAfterPro?.subscriptionStatus === "active",
    "Webhook sets PRO subscriptionStatus active"
  );
  check(
    userAfterPro?.subscriptionId === `sub_matrix_pro_${matrixId}`,
    "Webhook stores PRO subscriptionId"
  );

  await sendWebhook({
    id: `evt_matrix_pro_update_${matrixId}`,
    object: "event",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: `sub_matrix_pro_${matrixId}`,
        object: "subscription",
        status: "active",
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        metadata: {
          userId: testUser.id,
          product: "pro_subscription",
          plan: "pro_monthly",
        },
      },
    },
  });

  let userAfterProUpdate = await refreshUser();

  check(userAfterProUpdate?.role === "PRO", "Subscription update preserves PRO role");
  check(
    userAfterProUpdate?.subscriptionStatus === "active",
    "Subscription update keeps status active"
  );

  await sendWebhook({
    id: `evt_matrix_agency_${matrixId}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_matrix_agency_${matrixId}`,
        object: "checkout.session",
        mode: "subscription",
        payment_status: "paid",
        status: "complete",
        customer: `cus_matrix_${matrixId}`,
        subscription: `sub_matrix_agency_${matrixId}`,
        metadata: {
          userId: testUser.id,
          product: "agency_subscription",
          plan: "agency_monthly",
        },
      },
    },
  });

  let userAfterAgency = await refreshUser();

  check(userAfterAgency?.role === "BUSINESS", "Webhook activates Agency as BUSINESS role");
  check(
    userAfterAgency?.subscriptionStatus === "active",
    "Webhook sets Agency subscriptionStatus active"
  );
  check(
    userAfterAgency?.subscriptionId === `sub_matrix_agency_${matrixId}`,
    "Webhook stores Agency subscriptionId"
  );

  await sendWebhook({
    id: `evt_matrix_invoice_failed_${matrixId}`,
    object: "event",
    type: "invoice.payment_failed",
    data: {
      object: {
        id: `in_matrix_${matrixId}`,
        object: "invoice",
        subscription: `sub_matrix_agency_${matrixId}`,
      },
    },
  });

  let userAfterFailedPayment = await refreshUser();

  check(
    userAfterFailedPayment?.subscriptionStatus === "past_due",
    "Payment failed webhook sets subscriptionStatus past_due"
  );

  await sendWebhook({
    id: `evt_matrix_subscription_deleted_${matrixId}`,
    object: "event",
    type: "customer.subscription.deleted",
    data: {
      object: {
        id: `sub_matrix_agency_${matrixId}`,
        object: "subscription",
        status: "canceled",
        metadata: {
          userId: testUser.id,
          product: "agency_subscription",
          plan: "agency_monthly",
        },
      },
    },
  });

  let userAfterCancel = await refreshUser();

  check(userAfterCancel?.role === "FREE", "Subscription deleted webhook returns user to FREE");
  check(
    userAfterCancel?.subscriptionStatus === "cancelled",
    "Subscription deleted webhook sets status cancelled"
  );

  console.log("");
  console.log("================================================");
  console.log(" CLEANUP");
  console.log("================================================");

  if (failures.length === 0) {
    await prisma.event.deleteMany({
      where: {
        OR: [
          {
            userId: testUser.id,
          },
          {
            reportId: testReport.id,
          },
        ],
      },
    });

    await prisma.upload.deleteMany({
      where: {
        userId: testUser.id,
      },
    });

    await prisma.user.delete({
      where: {
        id: testUser.id,
      },
    });

    pass("Cleaned up test user, report, and events");
  } else {
    console.log("⚠️ Keeping test data for debugging because failures occurred.");
    console.log(`Test user email: ${testUser.email}`);
    console.log(`Test report id: ${testReport.id}`);
  }
} catch (error) {
  fail(error?.stack || error?.message || String(error));

  if (testUser) {
    console.log("");
    console.log("Debug test user:");
    console.log(testUser.email);
  }

  if (testReport) {
    console.log("Debug test report:");
    console.log(testReport.id);
  }
} finally {
  await prisma.$disconnect();
}

console.log("");
console.log("================================================");
console.log(" MATRIX SUMMARY");
console.log("================================================");

if (failures.length > 0) {
  console.log(`❌ Failed checks: ${failures.length}`);

  for (const item of failures) {
    console.log(` - ${item}`);
  }

  process.exit(1);
}

console.log("✅ All pricing matrix checks passed");
