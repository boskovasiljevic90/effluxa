import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session: any = event.data.object;
      const orgId = session.metadata?.orgId;

      if (orgId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: "active",
            plan: "pro",
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription: any = event.data.object;

      await prisma.organization.updateMany({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          subscriptionStatus: "canceled",
          plan: "free",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
