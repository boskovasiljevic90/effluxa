export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import { getPaddle } from "@/lib/paddle";
import { prisma } from "@/lib/prisma";
import { provisionPaddleTransaction, syncPaddleSubscription } from "@/lib/paddleProvisioning";
import { trackError } from "@/lib/errorTracking";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("paddle-signature") || "";
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.replace(/\\[rn]/g, "").trim();
  const rawBody = await req.text();

  if (!secret || !signature) {
    return NextResponse.json(
      { error: "Paddle webhook is not configured" },
      { status: 400 }
    );
  }

  let eventData;

  try {
    eventData = await getPaddle().webhooks.unmarshal(
      rawBody,
      secret,
      signature
    );
  } catch (error) {
    console.error("PADDLE WEBHOOK SIGNATURE ERROR:", error);

    await trackError({
      type: "paddle_webhook_signature_error",
      error,
    });

    return NextResponse.json(
      { error: "Webhook signature invalid" },
      { status: 400 }
    );
  }

  try {
    if (eventData.eventType === EventName.TransactionCompleted) {
      await provisionPaddleTransaction(eventData.data);
    }

    if (
      eventData.eventType === EventName.SubscriptionCreated ||
      eventData.eventType === EventName.SubscriptionActivated ||
      eventData.eventType === EventName.SubscriptionTrialing ||
      eventData.eventType === EventName.SubscriptionUpdated ||
      eventData.eventType === EventName.SubscriptionPastDue ||
      eventData.eventType === EventName.SubscriptionPaused ||
      eventData.eventType === EventName.SubscriptionResumed ||
      eventData.eventType === EventName.SubscriptionCanceled
    ) {
      await syncPaddleSubscription(eventData.data);
    }

    if (eventData.eventType === EventName.TransactionPaymentFailed) {
      const transaction = eventData.data;

      if (transaction.subscriptionId) {
        await prisma.user.updateMany({
          where: { paddleSubscriptionId: transaction.subscriptionId },
          data: { subscriptionStatus: "past_due" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PADDLE WEBHOOK HANDLER ERROR:", error);

    await trackError({
      type: "paddle_webhook_handler_error",
      error,
    });

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
