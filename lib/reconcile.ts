import { prisma } from "@/lib/prisma";

type AnyRow = { id: string; raw: any; createdAt: Date; orgId: string };

function parseDateLoose(v: any): number | null {
  if (!v) return null;
  const d = new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function getInvoiceDateTs(inv: AnyRow): number {
  const raw = inv?.raw || {};
  // pokušaj više mogućih ključeva
  const ts =
    parseDateLoose(raw.invoiceDate) ??
    parseDateLoose(raw.invoice_date) ??
    parseDateLoose(raw.date) ??
    parseDateLoose(raw.invoiceIssuedAt) ??
    null;

  // fallback: createdAt
  return ts ?? new Date(inv.createdAt).getTime();
}

export async function runReconciliation(orgId: string) {
  // Kreiraj reconcile run (schema ima summary Json? pa ovo sme)
  const run = await prisma.reconcileRun.create({
    data: { orgId, summary: { startedAt: new Date().toISOString() } },
  });

  // InvoiceRow nema invoiceDate kolonu -> NE SME orderBy invoiceDate
  const invoices = (await prisma.invoiceRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
    take: 5000,
  })) as AnyRow[];

  const payments = (await prisma.paymentRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
    take: 5000,
  })) as AnyRow[];

  // Sort invoices u JS-u po raw.invoiceDate (ako postoji)
  invoices.sort((a, b) => {
    const ta = getInvoiceDateTs(a);
    const tb = getInvoiceDateTs(b);
    if (ta !== tb) return ta - tb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Minimalna logika rezultata (da build/flow radi) — možeš posle da unaprediš matching.
  // Kreiramo rezultat za svaki invoice: default "unmatched"
  // currency pokušavamo iz raw
  const resultsData = invoices.map((inv) => {
    const raw = inv.raw || {};
    const currency =
      raw.currency ||
      raw.Currency ||
      raw.ccy ||
      raw.CCY ||
      null;

    return {
      orgId,
      runId: run.id,
      invoiceRowId: inv.id,
      status: "unmatched",
      currency: currency ? String(currency) : null,
      paidTotal: null,
      outstanding: null,
      createdAt: new Date(),
    };
  });

  if (resultsData.length) {
    // Prisma createMany nema return objekata, ali dovoljno je da popuni bazu
    await prisma.reconcileResult.createMany({
      data: resultsData as any,
      skipDuplicates: false,
    });
  }

  await prisma.reconcileRun.update({
    where: { id: run.id },
    data: {
      summary: {
        startedAt: (run.summary as any)?.startedAt || new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        invoices: invoices.length,
        payments: payments.length,
        results: resultsData.length,
      },
    },
  });

  return { runId: run.id, invoices: invoices.length, payments: payments.length };
}
