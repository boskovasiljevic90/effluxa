import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrigin(req: Request) {
  return req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function handler(req: Request) {
  const { userId, orgId } = await auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: "Missing organization" }, { status: 400 });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripePriceId = process.env.STRIPE_PRICE_ID;

  if (!stripeSecret) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  if (!stripePriceId) return NextResponse.json({ error: "Missing STRIPE_PRICE_ID" }, { status: 500 });

  const stripe = new Stripe(stripeSecret);

  const origin = getOrigin(req);
  const successUrl = `${origin}/app?checkout=success`;
  const cancelUrl = `${origin}/app?checkout=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orgId, userId },
  });

  if (!session?.url) return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });

  return NextResponse.json({ url: session.url });
}

export async function POST(req: Request) {
  try {
    return await handler(req);
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", message: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    return await handler(req);
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", message: e?.message ?? String(e) }, { status: 500 });
  }
}
