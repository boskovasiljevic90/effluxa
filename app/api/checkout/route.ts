import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/backend";

// Lemon hosted checkout URL (copy from Lemon variant “Checkout URL”)
const LEMON_CHECKOUT_URL = process.env.LEMON_CHECKOUT_URL || "";
const CLERK_JWT_PUBLIC_KEY = process.env.CLERK_JWT_PUBLIC_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || "";
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CLERK_JWT_PUBLIC_KEY) return NextResponse.json({ error: "Missing CLERK_JWT_PUBLIC_KEY" }, { status: 500 });

    const { payload } = await verifyToken(token, { jwtKey: CLERK_JWT_PUBLIC_KEY });

    const userId = (payload?.sub as string) || "";
    // orgId: prefer header, fallback to token claim "o.id" if present
    const headerOrgId = req.headers.get("x-clerk-org-id") || "";
    const tokenOrgId = (payload as any)?.o?.id || "";
    const orgId = headerOrgId || tokenOrgId;

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Missing organization" }, { status: 400 });

    if (!LEMON_CHECKOUT_URL) {
      return NextResponse.json(
        { error: "Missing LEMON_CHECKOUT_URL" },
        { status: 500 }
      );
    }

    // Build Lemon URL with optional custom fields (safe even if Lemon ignores)
    const u = new URL(LEMON_CHECKOUT_URL);

    // Lemon supports custom fields on hosted checkout in many setups; harmless if ignored
    u.searchParams.set("checkout[custom][orgId]", orgId);
    u.searchParams.set("checkout[custom][userId]", userId);

    // Where Lemon should send the user back after payment
    // IMPORTANT: you must set these in Lemon too (Return/Redirect URLs), but we also add them here.
    const origin = req.headers.get("x-forwarded-origin") || req.headers.get("origin") || "";
    if (origin) {
      u.searchParams.set("checkout[success_url]", `${origin}/app?checkout=success`);
      u.searchParams.set("checkout[cancel_url]", `${origin}/app?checkout=cancel`);
    }

    return NextResponse.json({ url: u.toString() });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
