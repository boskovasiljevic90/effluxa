import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrigin(req: Request) {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const a = await auth();

    const userId = a.userId;
    const sessionClaims: any = a.sessionClaims;

    // Clerk sometimes doesn't populate orgId, but it exists in sessionClaims ("o.id")
    const orgId =
      a.orgId ||
      sessionClaims?.o?.id ||
      sessionClaims?.org_id ||
      null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hard fallback so app can work even without org context.
    const tenantId = orgId || userId;

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRICE_ID;

    if (!stripeSecret) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    if (!stripePriceId) return NextResponse.json({ error: "Missing STRIPE_PRICE_ID" }, { status: 500 });

    const stripe = new Stripe(stripeSecret); // no apiVersion to avoid TS mismatch

    const origin = getOrigin(req);
    const successUrl = `${origin}/app?checkout=success`;
    const cancelUrl = `${origin}/app?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId, // <-- orgId if available, else userId
        userId,
      },
    });

    if (!session?.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// Optional: allow GET too (some UIs call GET by mistake)
export async function GET(req: Request) {
  return POST(req);
}
