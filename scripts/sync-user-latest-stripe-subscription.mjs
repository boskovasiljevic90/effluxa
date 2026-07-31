import fs from "fs";
import Stripe from "stripe";
import { PrismaClient, Role } from "@prisma/client";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) continue;

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[match[1]] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const email = process.argv[2];
const desiredPlan = process.argv[3] || "";

if (!email) {
  console.error("Usage: node scripts/sync-user-latest-stripe-subscription.mjs user@email.com [plan]");
  process.exit(1);
}

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


function inferredSubscriptionEndDate(subscription, plan) {
  const explicitPeriodEnd =
    subscription?.current_period_end ||
    subscription?.items?.data?.[0]?.current_period_end;

  if (explicitPeriodEnd) {
    return new Date(explicitPeriodEnd * 1000);
  }

  const priceInterval =
    subscription?.items?.data?.[0]?.price?.recurring?.interval;

  const normalizedPlan = String(plan || "");

  const inferredInterval =
    priceInterval ||
    (normalizedPlan.includes("annual") ? "year" : "month");

  const date = new Date();

  if (inferredInterval === "year") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date;
}

function roleFromProduct(product) {
  if (product === "pro_subscription") return Role.PRO;

  if (
    product === "agency_subscription" ||
    product === "business_subscription"
  ) {
    return Role.BUSINESS;
  }

  return null;
}

try {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
  });

  const candidates = sessions.data
    .filter((session) => {
      if (session.mode !== "subscription") return false;
      if (session.status !== "complete") return false;
      if (session.metadata?.userId !== user.id) return false;

      if (desiredPlan && session.metadata?.plan !== desiredPlan) {
        return false;
      }

      return Boolean(roleFromProduct(session.metadata?.product));
    })
    .sort((a, b) => b.created - a.created);

  console.log("");
  console.log("========== MATCHING CHECKOUT SESSIONS ==========");

  for (const session of candidates.slice(0, 10)) {
    console.log({
      id: session.id,
      created: new Date(session.created * 1000).toISOString(),
      product: session.metadata?.product,
      plan: session.metadata?.plan,
      subscription: session.subscription,
      customer: session.customer,
    });
  }

  if (candidates.length === 0) {
    throw new Error(
      desiredPlan
        ? `No completed subscription checkout found for ${email} and plan ${desiredPlan}`
        : `No completed subscription checkout found for ${email}`
    );
  }

  const selected = await stripe.checkout.sessions.retrieve(
    candidates[0].id,
    {
      expand: [
        "subscription",
        "customer",
      ],
    }
  );

  let subscription = selected.subscription;

  if (typeof selected.subscription === "string") {
    subscription = await stripe.subscriptions.retrieve(
      selected.subscription
    );
  }

  const product =
    selected.metadata?.product ||
    subscription?.metadata?.product;

  const plan =
    selected.metadata?.plan ||
    subscription?.metadata?.plan;

  const role = roleFromProduct(product);

  if (!role) {
    throw new Error(`Unsupported product: ${product}`);
  }

  const customer = selected.customer;

  const stripeCustomerId =
    typeof customer === "string"
      ? customer
      : customer?.id;

  const subscriptionId =
    typeof selected.subscription === "string"
      ? selected.subscription
      : subscription?.id;

  const subscriptionStatus =
    subscription?.status ||
    "active";

  const subscriptionEndDate =
    inferredSubscriptionEndDate(subscription, plan);

  const updated = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role,
      stripeCustomerId: stripeCustomerId || undefined,
      subscriptionId: subscriptionId || undefined,
      subscriptionStatus,
      subscriptionEndDate,
    },
    select: {
      email: true,
      role: true,
      subscriptionStatus: true,
      subscriptionId: true,
      stripeCustomerId: true,
      subscriptionEndDate: true,
    },
  });

  console.log("");
  console.log("========== SELECTED SESSION ==========");
  console.log({
    sessionId: selected.id,
    product,
    plan,
    subscriptionId,
    subscriptionStatus,
    subscriptionEndDate,
  });

  console.log("");
  console.log("========== UPDATED USER ==========");
  console.log(updated);
} finally {
  await prisma.$disconnect();
}
