import { prisma } from "./prisma";

type AnyRow = { id: string; orgId: string; raw: any; createdAt: Date };

function asString(v: any): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function asNumber(v: any): number | null {
  if (v == null || v === "") return null;
  const n =
    typeof v === "number" ? v : Number(String(v).replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

function asDate(v: any): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function pickNumber(raw: any, keys: string[]): number | null {
  for (const k of keys) {
    const val = raw?.[k];
    const n = asNumber(val);
    if (n != null) return n;
  }
  return null;
}

function pickString(raw: any, keys: string[]): string {
  for (const k of keys) {
    const val = raw?.[k];
    const s = asString(val).trim();
    if (s) return s;
  }
  return "";
}

function pickDate(raw: any, keys: string[]): Date | null {
  for (const k of keys) {
    const d = asDate(raw?.[k]);
    if (d) return d;
  }
  return null;
}

export async function runReconciliation(orgId: string) {
  const run = await prisma.reconcileRun.create({
    data: {
      orgId,
      summary: { startedAt: new Date().toISOString() },
    },
  });

  const invoices: AnyRow[] = await prisma.invoiceRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  const payments: AnyRow[] = await prisma.paymentRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  invoices.sort((a, b) => {
    const da =
      pickDate(a.raw, ["invoiceDate", "date", "issuedAt", "issued", "Invoice Date"]) ||
      a.createdAt;
    const db =
      pickDate(b.raw, ["invoiceDate", "date", "issuedAt", "issued", "Invoice Date"]) ||
      b.createdAt;
    return da.getTime() - db.getTime();
  });

  payments.sort((a, b) => {
    const da =
      pickDate(a.raw, ["paymentDate", "date", "paidAt", "paid", "Payment Date"]) ||
      a.createdAt;
    const db =
      pickDate(b.raw, ["paymentDate", "date", "paidAt", "paid", "Payment Date"]) ||
      b.createdAt;
    return da.getTime() - db.getTime();
  });

  let matched = 0;
  let unmatched = 0;

  for (const inv of invoices) {
    const invNo = pickString(inv.raw, [
      "invoiceNo",
      "invoiceNumber",
      "number",
      "Invoice #",
      "Invoice No",
      "Invoice",
    ]);

    const currency = pickString(inv.raw, ["currency", "Currency"]).toUpperCase() || null;

    const invAmount = pickNumber(inv.raw, [
      "amount",
      "total",
      "gross",
      "invoiceTotal",
      "Total",
      "Amount",
    ]);

    const candidates = payments.filter((p) => {
      const pRef = pickString(p.raw, [
        "reference",
        "ref",
        "invoiceNo",
        "invoiceNumber",
        "Reference",
      ]);

      const pCur = pickString(p.raw, ["currency", "Currency"]).toUpperCase() || null;
      if (currency && pCur && currency !== pCur) return false;

      if (invNo && pRef && pRef.includes(invNo)) return true;

      const pAmt = pickNumber(p.raw, ["amount", "paid", "value", "Total", "Amount"]);
      if (invAmount != null && pAmt != null && Math.abs(invAmount - pAmt) < 0.01)
        return true;

      return false;
    });

    const paidTotal = candidates.reduce((sum, p) => {
      const pAmt = pickNumber(p.raw, ["amount", "paid", "value", "Total", "Amount"]);
      return sum + (pAmt ?? 0);
    }, 0);

    const outstanding = invAmount != null ? Math.max(invAmount - paidTotal, 0) : null;

    const status =
      invAmount == null
        ? candidates.length
          ? "MATCHED"
          : "UNKNOWN"
        : outstanding === 0
        ? "PAID"
        : paidTotal > 0
        ? "PARTIAL"
        : "UNPAID";

    await prisma.reconcileResult.create({
      data: {
        orgId,
        runId: run.id,
        invoiceRowId: inv.id,
        status,
        currency,
        paidTotal,
        outstanding,
      },
    });

    if (candidates.length) matched += 1;
    else unmatched += 1;
  }

  await prisma.reconcileRun.update({
    where: { id: run.id },
    data: {
      summary: {
        startedAt: (run.summary as any)?.startedAt ?? new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        invoices: invoices.length,
        payments: payments.length,
        matched,
        unmatched,
      },
    },
  });

  return { runId: run.id, matched, unmatched };
}
