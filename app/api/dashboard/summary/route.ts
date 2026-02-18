import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Status = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID" | "MISMATCH";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Missing organization" }, { status: 400 });
    }

    const results = await prisma.reconcileResult.findMany({
      where: { orgId },
      include: { invoiceRow: true },
    });

    let totalInvoices = 0;

    const counts: Record<Status, number> = {
      UNPAID: 0,
      PARTIAL: 0,
      PAID: 0,
      OVERPAID: 0,
      MISMATCH: 0,
    };

    for (const r of results) {
      totalInvoices += 1;

      const status = r.status as Status;

      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      totalInvoices,
      counts,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
