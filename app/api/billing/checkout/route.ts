import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: "PRICE_ID_FROM_STRIPE",
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app/results`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app/results`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
