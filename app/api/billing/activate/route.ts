import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary activation endpoint.
// We DO NOT touch Prisma here to avoid schema mismatches.
// This allows Vercel build to pass.
export async function POST(req: Request) {
  try {
    const CLERK_JWT_PUBLIC_KEY = process.env.CLERK_JWT_PUBLIC_KEY;

    if (!CLERK_JWT_PUBLIC_KEY) {
      return NextResponse.json(
        { error: "Missing CLERK_JWT_PUBLIC_KEY" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await verifyToken(token, {
      jwtKey: CLERK_JWT_PUBLIC_KEY,
    });

    const p: any = payload as any;
    const userId = p?.sub || null;

    const headerOrgId = req.headers.get("x-clerk-org-id") || "";
    const tokenOrgId = p?.o?.id || "";
    const orgId = headerOrgId || tokenOrgId;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user" },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing organization" },
        { status: 400 }
      );
    }

    // SUCCESS WITHOUT DB WRITE
    return NextResponse.json({ ok: true, userId, orgId });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
