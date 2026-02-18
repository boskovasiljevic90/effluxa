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

    const vt = await verifyToken(token, { jwtKey: CLERK_JWT_PUBLIC_KEY });
    const payload: any = (vt as any)?.payload || {};

    const userId: string = payload?.sub || "";
    const headerOrgId = req.headers.get("x-clerk-org-id") || "";
    const tokenOrgId: string = payload?.o?.id || payload?.org_id || "";
    const orgId = headerOrgId || tokenOrgId;

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Missing organization" }, { status: 400 });

    // ✅ Temporary activation for 30 days (test flow).
    // Later: replace with Lemon webhook truth.
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.organizationSubscription.upsert({
      where: { orgId },
      update: { status: "active", currentPeriodEnd: periodEnd },
      create: {
        orgId,
        stripeCustomerId: "lemon_test",
        stripeSubscriptionId: "lemon_test",
        status: "active",
        currentPeriodEnd: periodEnd,
      },
    });

    return NextResponse.json({
      ok: true,
      orgId,
      status: "active",
      currentPeriodEnd: periodEnd.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
