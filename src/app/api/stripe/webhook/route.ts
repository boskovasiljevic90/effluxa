export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);

    await trackError({
      type: "stripe_webhook_signature_error",
      error: err,
    });

    return NextResponse.json(
      { error: "Webhook error" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const reportId = session.metadata?.reportId;
      const product = session.metadata?.product;

      if (product === "business_subscription") {
        if (!userId) {
          console.log("BUSINESS SUBSCRIPTION MISSING USER ID");
        } else {
          await prisma.user.update({
            where: { id: userId },
            data: {
              role: "BUSINESS",
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : null,
              subscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : null,
              subscriptionStatus: "active",
              subscriptionEndDate: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ),
            },
          });

          await trackEvent({
            type: "business_subscription_activated",
            userId,
            metadata: {
              sessionId: session.id,
            },
          });

          console.log(
            "BUSINESS SUBSCRIPTION ACTIVATED:",
            userId
          );
        }
      }

      if (userId && reportId) {
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
          type: "report_unlocked",
          userId,
          reportId,
          metadata: {
            sessionId: session.id,
            paymentStatus: session.payment_status,
          },
        });

        console.log(
          "FULL AUDIT UNLOCKED FOR REPORT:",
          reportId
        );
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
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: isActive ? "BUSINESS" : "FREE",
            subscriptionStatus: isActive ? "active" : subscription.status,
            subscriptionEndDate: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : user.subscriptionEndDate,
          },
        });

        await trackEvent({
          type: isActive
            ? "business_subscription_updated"
            : "business_subscription_inactive",
          userId: user.id,
          metadata: {
            subscriptionId: subscription.id,
            status: subscription.status,
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
          where: { id: user.id },
          data: {
            role: "FREE",
            subscriptionStatus: "cancelled",
            subscriptionEndDate: new Date(),
          },
        });

        await trackEvent({
          type: "business_subscription_cancelled",
          userId: user.id,
          metadata: {
            subscriptionId: subscription.id,
            status: subscription.status,
          },
        });
      }
    }


    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as any;

      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : null;

      if (subscriptionId) {
        const user = await prisma.user.findFirst({
          where: {
            subscriptionId,
          },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              role: "FREE",
              subscriptionStatus: "past_due",
            },
          });

          await trackEvent({
            type: "business_subscription_payment_failed",
            userId: user.id,
            metadata: {
              subscriptionId,
              invoiceId: invoice.id,
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("STRIPE WEBHOOK ERROR:", error);

    await trackError({
      type: "stripe_webhook_error",
      error,
    });

    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}
