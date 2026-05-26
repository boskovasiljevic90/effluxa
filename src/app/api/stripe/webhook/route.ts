import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
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
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("SESSION METADATA:", session.metadata);

    const userId = session.metadata?.userId;
    const reportId = session.metadata?.reportId;

    if (!userId || !reportId) {
      console.log("MISSING USER ID OR REPORT ID IN METADATA");
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

      console.log("FULL AUDIT UNLOCKED FOR REPORT:", reportId);
    }
  }

  return NextResponse.json({ received: true });
}
