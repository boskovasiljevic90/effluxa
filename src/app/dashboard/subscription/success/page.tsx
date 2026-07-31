export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type PageProps = {
  searchParams?: {
    session_id?: string | string[];
  };
};

function roleFromProduct(product?: string | null) {
  if (product === "pro_subscription") {
    return Role.PRO;
  }

  if (
    product === "agency_subscription" ||
    product === "business_subscription"
  ) {
    return Role.BUSINESS;
  }

  return null;
}

async function cancelPreviousSubscription(
  previousSubscriptionId?: string | null,
  nextSubscriptionId?: string | null
) {
  if (!previousSubscriptionId || !nextSubscriptionId) {
    return;
  }

  if (previousSubscriptionId === nextSubscriptionId) {
    return;
  }

  try {
    await stripe.subscriptions.cancel(previousSubscriptionId);

    console.log(
      "Cancelled previous subscription after successful checkout:",
      previousSubscriptionId
    );
  } catch (error) {
    console.error(
      "Previous subscription cancellation failed, continuing sync:",
      error
    );
  }
}

async function syncCheckoutSession(
  sessionId: string,
  authenticatedUserId: string
) {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: authenticatedUserId,
    },
    select: {
      subscriptionId: true,
    },
  });

  const session = await stripe.checkout.sessions.retrieve(
    sessionId,
    {
      expand: [
        "subscription",
        "customer",
      ],
    }
  );

  if (session.mode !== "subscription") {
    throw new Error("Checkout session is not a subscription session");
  }

  if (session.status !== "complete") {
    throw new Error("Checkout session is not complete");
  }

  const metadata = session.metadata || {};

  if (metadata.userId !== authenticatedUserId) {
    throw new Error("Checkout session does not belong to authenticated user");
  }

  const role = roleFromProduct(metadata.product);

  if (!role) {
    throw new Error(`Unsupported subscription product: ${metadata.product}`);
  }

  let subscription: any = session.subscription;

  if (typeof session.subscription === "string") {
    subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
  }

  const customer: any = session.customer;

  const stripeCustomerId =
    typeof customer === "string"
      ? customer
      : customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : subscription?.id;

  const subscriptionStatus =
    subscription?.status ||
    "active";

  const subscriptionEndDate =
    subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: {
      id: authenticatedUserId,
    },
    data: {
      role,
      stripeCustomerId: stripeCustomerId || undefined,
      subscriptionId: subscriptionId || undefined,
      subscriptionStatus,
      subscriptionEndDate,
    },
  });

  await cancelPreviousSubscription(
    currentUser?.subscriptionId,
    subscriptionId
  );
}

export default async function SubscriptionSuccessPage({
  searchParams,
}: PageProps) {
  const rawSessionId = searchParams?.session_id;
  const sessionId = Array.isArray(rawSessionId)
    ? rawSessionId[0]
    : rawSessionId;

  if (!sessionId) {
    redirect("/dashboard?subscription=missing_session");
  }

  const token = cookies().get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let decoded: {
    userId: string;
  };

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
    };
  } catch {
    redirect("/login");
  }

  try {
    await syncCheckoutSession(
      sessionId,
      decoded.userId
    );
  } catch (error) {
    console.error("SUBSCRIPTION SUCCESS SYNC FAILED:", error);

    redirect("/dashboard?subscription=sync_failed");
  }

  redirect("/dashboard?subscription=success");
}
