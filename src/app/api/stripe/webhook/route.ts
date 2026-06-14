export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

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
              subscriptionStatus: "active",
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : null,
              stripeSubscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : null,
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
