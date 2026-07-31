export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function subscriptionRole(product?: string | null) {
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

function subscriptionEndDate(subscription: any) {
  return subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
      "Cancelled previous subscription from webhook:",
      previousSubscriptionId
    );
  } catch (error) {
    console.error(
      "Previous subscription cancellation failed in webhook:",
      error
    );

    await trackError({
      type: "previous_subscription_cancellation_failed",
      error,
    });
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature || "",
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("STRIPE WEBHOOK SIGNATURE ERROR:", error);

    await trackError({
      type: "stripe_webhook_signature_error",
      error,
    });

    return NextResponse.json(
      { error: "Webhook signature invalid" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const metadata = session.metadata || {};
      const userId = metadata.userId;
      const reportId = metadata.reportId;
      const product = metadata.product;

      if (product === "full_audit_unlock" && reportId && userId) {
        await prisma.upload.updateMany({
          where: {
            id: reportId,
            userId,
          },
          data: {
            unlocked: true,
            unlockedAt: new Date(),
            checkoutSessionId: session.id,
          },
        });

        await trackEvent({
          type: "full_audit_unlocked",
          userId,
          reportId,
          metadata: {
            sessionId: session.id,
            product,
          },
        });
      }

      const role = subscriptionRole(product);

      if (role && userId) {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        let subscription: any = null;

        if (subscriptionId) {
          try {
            subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
          } catch (error) {
            console.error(
              "Could not retrieve subscription during checkout webhook:",
              error
            );
          }
        }

        const currentUser = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            subscriptionId: true,
          },
        });

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            role,
            stripeCustomerId: stripeCustomerId || undefined,
            subscriptionId: subscriptionId || undefined,
            subscriptionStatus:
              subscription?.status || "active",
            subscriptionEndDate:
              subscriptionEndDate(subscription),
          },
        });

        await cancelPreviousSubscription(
          currentUser?.subscriptionId,
          subscriptionId
        );

        await trackEvent({
          type: `${product}_activated`,
          userId,
          metadata: {
            sessionId: session.id,
            subscriptionId,
            product,
            plan: metadata.plan,
          },
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as any;

      const user = await prisma.user.findFirst({
        where: {
          subscriptionId: subscription.id,
        },
      });

      if (user) {
        const product = subscription.metadata?.product;
        const active =
          subscription.status === "active" ||
          subscription.status === "trialing";

        const role =
          active
            ? subscriptionRole(product) || user.role
            : Role.FREE;

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            role,
            subscriptionStatus: subscription.status,
            subscriptionEndDate:
              subscriptionEndDate(subscription),
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;

      const user = await prisma.user.findFirst({
        where: {
          subscriptionId: subscription.id,
        },
      });

      if (user) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            role: Role.FREE,
            subscriptionStatus: "cancelled",
            subscriptionEndDate: new Date(),
          },
        });

        await trackEvent({
          type: "subscription_cancelled",
          userId: user.id,
          metadata: {
            subscriptionId: subscription.id,
          },
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as any;

      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (subscriptionId) {
        const user = await prisma.user.findFirst({
          where: {
            subscriptionId,
          },
        });

        if (user) {
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              subscriptionStatus: "past_due",
            },
          });
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("STRIPE WEBHOOK HANDLER ERROR:", error);

    await trackError({
      type: "stripe_webhook_handler_error",
      error,
    });

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
