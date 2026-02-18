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

    const run = await prisma.reconcileRun.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });

    if (!run) {
      return NextResponse.json({
        ok: true,
        orgId,
        runId: null,
        message: "No reconciliation runs yet.",
      });
    }

    const results = await prisma.reconcileResult.findMany({
      where: { orgId, runId: run.id },
      include: { invoiceRow: true },
    });

    const counts = { PAID: 0, PARTIAL: 0, UNPAID: 0, OVERPAID: 0, MISMATCH: 0 } as Record<
      "PAID" | "PARTIAL" | "UNPAID" | "OVERPAID" | "MISMATCH",
      number
    >;

    let totalInvoices = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    const byCurrency: Record<string, { invoices: number; amount: number; paid: number; outstanding: number }> = {};
    const byVendor: Record<string, { invoices: number; amount: number; outstanding: number }> = {};

    for (const r of results as any[]) {
      totalInvoices += 1;
      counts[r.status] = (counts[r.status] || 0) + 1;

      const cur = r.currency || r.invoiceRow?.currency || "(null)";
      const vendor = r.invoiceRow?.vendor || r.invoiceRow?.raw?.vendor || "(unknown)";

      const invAmount = Number(r.invoiceRow?.amount?.toNumber?.() ?? r.invoiceRow?.amount ?? 0) || 0;
      const paid = Number(r.paidTotal?.toNumber?.() ?? r.paidTotal ?? 0) || 0;
      const out = Number(r.outstanding?.toNumber?.() ?? r.outstanding ?? 0) || 0;

      totalAmount += invAmount;
      totalPaid += paid;
      totalOutstanding += out;

      byCurrency[cur] ??= { invoices: 0, amount: 0, paid: 0, outstanding: 0 };
      byCurrency[cur].invoices += 1;
      byCurrency[cur].amount += invAmount;
      byCurrency[cur].paid += paid;
      byCurrency[cur].outstanding += out;

      byVendor[vendor] ??= { invoices: 0, amount: 0, outstanding: 0 };
      byVendor[vendor].invoices += 1;
      byVendor[vendor].amount += invAmount;
      byVendor[vendor].outstanding += out;
    }

    const topVendors = Object.entries(byVendor)
      .map(([vendor, v]) => ({ vendor, ...v }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 10);

    const currencyRows = Object.entries(byCurrency)
      .map(([currency, v]) => ({ currency, ...v }))
      .sort((a, b) => b.outstanding - a.outstanding);

    return NextResponse.json({
      ok: true,
      orgId,
      runId: run.id,
      finishedAt: (run as any).summary?.finishedAt ?? null,
      counts,
      totals: {
        invoices: totalInvoices,
        amount: totalAmount,
        paid: totalPaid,
        outstanding: totalOutstanding,
      },
      byCurrency: currencyRows,
      topVendors,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", message: e?.message ?? String(e) }, { status: 500 });
  }
}
