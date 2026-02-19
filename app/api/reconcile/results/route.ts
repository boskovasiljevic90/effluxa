import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await prisma.reconcileResult.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
