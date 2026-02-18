import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEMON_CHECKOUT_URL = process.env.LEMON_CHECKOUT_URL || "";
const CLERK_JWT_PUBLIC_KEY = process.env.CLERK_JWT_PUBLIC_KEY || "";

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
    if (!LEMON_CHECKOUT_URL) return NextResponse.json({ error: "Missing LEMON_CHECKOUT_URL" }, { status: 500 });

    const vt = await verifyToken(token, { jwtKey: CLERK_JWT_PUBLIC_KEY });
    const payload: any = (vt as any)?.payload || {};

    const userId: string = payload?.sub || "";
    const headerOrgId = req.headers.get("x-clerk-org-id") || "";
    const tokenOrgId: string = payload?.o?.id || payload?.org_id || "";
    const orgId = headerOrgId || tokenOrgId;

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Missing organization" }, { status: 400 });

    const u = new URL(LEMON_CHECKOUT_URL);

    // Custom metadata (harmless if Lemon ignores)
    u.searchParams.set("checkout[custom][orgId]", orgId);
    u.searchParams.set("checkout[custom][userId]", userId);

    const origin =
      req.headers.get("x-forwarded-origin") ||
      req.headers.get("origin") ||
      "";

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
