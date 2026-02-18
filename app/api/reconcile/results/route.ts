import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Missing org" }, { status: 400 });

    // Uzimamo NAJNOVIJI reconcile run za organizaciju
    const run = await prisma.reconcileRun.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });

    if (!run) {
      return NextResponse.json({ ok: true, results: [] });
    }

    const results = await prisma.reconcileResult.findMany({
      where: { runId: run.id },
      include: {
        invoiceRow: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      results,
      summary: run.summary,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

