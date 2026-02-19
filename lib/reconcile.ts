import { prisma } from "@/lib/prisma";

export async function runReconciliation() {
  const orgId = "demo-org";

  const run = await prisma.reconcileRun.create({
    data: { orgId },
  });

  const invoices = await prisma.invoiceRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  const payments = await prisma.paymentRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  for (const invoice of invoices) {
    const raw: any = invoice.raw || {};
    const invAmount = raw.amount ? Number(raw.amount) : null;
    const currency = raw.currency || null;

    let paidTotal = 0;

    for (const payment of payments) {
      const pRaw: any = payment.raw || {};

      if (
        pRaw.invoiceNumber &&
        raw.invoiceNumber &&
        pRaw.invoiceNumber === raw.invoiceNumber
      ) {
        paidTotal += Number(pRaw.amount || 0);
      }
    }

    const outstanding =
      invAmount !== null ? invAmount - paidTotal : null;

    const status =
      invAmount === null
        ? "unknown"
        : paidTotal === 0
        ? "unpaid"
        : outstanding === 0
        ? "paid"
        : "partial";

    await prisma.reconcileResult.create({
      data: {
        orgId,
        runId: run.id,
        invoiceRowId: invoice.id,
        status,
        currency,
        paidTotal,
        outstanding,
      },
    });
  }

  return { success: true };
}
