import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session: any = event.data.object;

        const customerId = session.customer;
        const subscriptionId = session.subscription;

        await prisma.organization.updateMany({
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
          },
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice: any = event.data.object;

        await prisma.organization.updateMany({
          where: {
            stripeCustomerId: invoice.customer,
          },
          data: {
            subscriptionStatus: "past_due",
          },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription: any = event.data.object;

        await prisma.organization.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            subscriptionStatus: "canceled",
          },
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
