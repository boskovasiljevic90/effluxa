import { NextResponse } from "next/server";
import { getOrgIdFromRequest } from "@/lib/auth";
import { ensureOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const orgId = getOrgIdFromRequest(req);
    await ensureOrg(orgId);

    const results = await prisma.reconcileResult.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
