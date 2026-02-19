import { prisma } from "@/lib/prisma";

export async function runReconciliation(orgId: string) {
  // 1. Kreiraj run
  const run = await prisma.reconcileRun.create({
    data: { orgId },
  });

  // 2. Očisti stare rezultate za ovaj org (opciono ali pametno)
  await prisma.reconcileResult.deleteMany({
    where: { orgId },
  });

  // 3. Učitaj invoice i payments
  const invoices = await prisma.invoiceRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  const payments = await prisma.paymentRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  let summary = {
    totalInvoices: invoices.length,
    paid: 0,
    unpaid: 0,
    partial: 0,
    unknown: 0,
  };

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

    if (status === "paid") summary.paid++;
    if (status === "unpaid") summary.unpaid++;
    if (status === "partial") summary.partial++;
    if (status === "unknown") summary.unknown++;

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

  // 4. Upis summary u run
  await prisma.reconcileRun.update({
    where: { id: run.id },
    data: { summary },
  });

  return { success: true, runId: run.id };
}
