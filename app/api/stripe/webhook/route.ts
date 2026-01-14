import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.log("❌ Webhook signature failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("✅ Webhook received:", event.type);

  try {
    // We only need these 3 to keep subscription status correct
    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const obj: any = event.data.object;

      let subscription: Stripe.Subscription | null = null;

      if (event.type === "checkout.session.completed") {
        const subscriptionId = obj?.subscription;
        if (subscriptionId) {
          subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
        }
      } else {
        subscription = obj as Stripe.Subscription;
      }

      if (!subscription) return NextResponse.json({ ok: true });

      const orgId =
        subscription.metadata?.orgId ||
        obj?.metadata?.orgId ||
        "";

      const userId =
        subscription.metadata?.userId ||
        obj?.metadata?.userId ||
        "";

      if (!orgId) {
        console.log("❌ Missing orgId in metadata");
        return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
      }

      const priceId = subscription.items.data[0]?.price?.id ?? null;

      await prisma.organizationSubscription.upsert({
        where: { orgId },
        create: {
          orgId,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
        },
        update: {
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
        },
      });

      console.log("✅ DB upserted for orgId:", orgId, "status:", subscription.status);
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.log("❌ Webhook handler failed:", e?.message || e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
