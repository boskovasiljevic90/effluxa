import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/backend";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const { payload } = await verifyToken(token, { jwtKey: CLERK_JWT_PUBLIC_KEY });

    const userId = (payload?.sub as string) || "";
    const headerOrgId = req.headers.get("x-clerk-org-id") || "";
    const tokenOrgId = (payload as any)?.o?.id || "";
    const orgId = headerOrgId || tokenOrgId;

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Missing organization" }, { status: 400 });

    // Activate for 30 days (test subscription). We'll replace this with Lemon webhook truth later.
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.organizationSubscription.upsert({
      where: { orgId },
      update: {
        status: "active",
        currentPeriodEnd: periodEnd,
        // Keep old stripe fields untouched; we can migrate later
      },
      create: {
        orgId,
        stripeCustomerId: "lemon_test",
        stripeSubscriptionId: "lemon_test",
        status: "active",
        currentPeriodEnd: periodEnd,
      },
    });

    return NextResponse.json({ ok: true, orgId, status: "active", currentPeriodEnd: periodEnd.toISOString() });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
