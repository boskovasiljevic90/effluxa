import fs from "fs";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

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
const shouldCancel = process.argv.includes("--cancel-test-duplicates");

if (!email) {
  console.error("Usage: node scripts/audit-and-clean-user-subscriptions.mjs user@email.com [--cancel-test-duplicates]");
  process.exit(1);
}

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const activeStatuses = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

try {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      role: true,
      subscriptionId: true,
      stripeCustomerId: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  console.log("");
  console.log("========== USER ==========");
  console.log(user);

  const customerIds = new Set();

  if (user.stripeCustomerId) {
    customerIds.add(user.stripeCustomerId);
  }

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
  });

  for (const session of sessions.data) {
    if (session.metadata?.userId === user.id) {
      if (typeof session.customer === "string") {
        customerIds.add(session.customer);
      }
    }
  }

  const subscriptionMap = new Map();

  for (const customerId of customerIds) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });

    for (const subscription of subscriptions.data) {
      subscriptionMap.set(subscription.id, subscription);
    }
  }

  for (const session of sessions.data) {
    if (
      session.metadata?.userId === user.id &&
      typeof session.subscription === "string"
    ) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );

        subscriptionMap.set(subscription.id, subscription);
      } catch {}
    }
  }

  const subscriptions = [...subscriptionMap.values()]
    .sort((a, b) => b.created - a.created);

  console.log("");
  console.log("========== STRIPE SUBSCRIPTIONS ==========");

  if (subscriptions.length === 0) {
    console.log("No Stripe subscriptions found for this user.");
  }

  for (const subscription of subscriptions) {
    const price =
      subscription.items?.data?.[0]?.price;

    console.log({
      id: subscription.id,
      status: subscription.status,
      currentInDb: subscription.id === user.subscriptionId,
      created: new Date(subscription.created * 1000).toISOString(),
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      product: subscription.metadata?.product,
      plan: subscription.metadata?.plan,
      priceId: price?.id,
      amount: price?.unit_amount,
      interval: price?.recurring?.interval || null,
    });
  }

  const duplicates = subscriptions.filter((subscription) => {
    if (subscription.id === user.subscriptionId) {
      return false;
    }

    return activeStatuses.has(subscription.status);
  });

  console.log("");
  console.log("========== DUPLICATES ==========");
  console.log(
    duplicates.length
      ? duplicates.map((subscription) => subscription.id)
      : "No active duplicates found."
  );

  if (!shouldCancel) {
    console.log("");
    console.log("Dry run only. Add --cancel-test-duplicates to cancel active duplicates in test mode.");
    process.exit(0);
  }

  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    console.log("");
    console.log("Refusing to cancel automatically because STRIPE_SECRET_KEY is not test mode.");
    process.exit(1);
  }

  for (const subscription of duplicates) {
    console.log(`Cancelling duplicate test subscription: ${subscription.id}`);

    await stripe.subscriptions.cancel(subscription.id);
  }

  console.log("");
  console.log("✅ Duplicate test subscription cleanup complete.");
} finally {
  await prisma.$disconnect();
}
