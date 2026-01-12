import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyToken } from "@clerk/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized (no token)" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties: ["http://localhost:3000"],
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = payload?.sub;
  const orgIdFromHeader = req.headers.get("x-clerk-org-id") || "";
  const orgId =
    orgIdFromHeader ||
    payload?.org_id ||
    payload?.orgId ||
    payload?.claims?.org_id ||
    payload?.claims?.orgId ||
    "";

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Missing org or user" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: "http://localhost:3000/app?paid=true",
    cancel_url: "http://localhost:3000/app?canceled=true",
    metadata: { orgId, userId },
  });

  return NextResponse.json({ url: session.url });
}
