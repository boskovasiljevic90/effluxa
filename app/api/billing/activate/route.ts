import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/backend";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This route is only for activating billing after checkout.
// We keep it TS-safe for Vercel builds by casting Clerk payload to `any`.
export async function POST(req: Request) {
  try {
    const CLERK_JWT_PUBLIC_KEY = process.env.CLERK_JWT_PUBLIC_KEY;

    if (!CLERK_JWT_PUBLIC_KEY) {
      return NextResponse.json({ error: "Missing CLERK_JWT_PUBLIC_KEY" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await verifyToken(token, { jwtKey: CLERK_JWT_PUBLIC_KEY });

    const p: any = payload as any;
    const userId = (p?.sub as string) || "";

    // org id can come from header (preferred) or token `o.id`
    const headerOrgId = req.headers.get("x-clerk-org-id") || "";
    const tokenOrgId = p?.o?.id || "";
    const orgId = headerOrgId || tokenOrgId;

    if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 400 });
    if (!orgId) return NextResponse.json({ error: "Missing organization" }, { status: 400 });

    // Mark org as active (simple flag). Adjust if your schema differs.
    await prisma.subscription.upsert({
      where: { orgId },
      update: { status: "active" },
      create: { orgId, status: "active" },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", message: e?.message ?? String(e) }, { status: 500 });
  }
}
