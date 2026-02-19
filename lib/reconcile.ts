import { prisma } from "./prisma";
import { normalizeInvoiceRaw, normalizePaymentRaw } from "./normalize";

type Reason = { reason: string; weight?: number; paymentRowId?: string };

function safeLower(v: any) {
  return (v ?? "").toString().trim().toLowerCase();
}

function sameCurrency(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return safeLower(a) === safeLower(b);
}

function abs(n: number) {
  return n < 0 ? -n : n;
}

export async function runReconciliation(orgId: string) {
  const run = await prisma.reconcileRun.create({
    data: { orgId, summary: { startedAt: new Date().toISOString() } },
  });

  const invoicesDb = await prisma.invoiceRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  const paymentsDb = await prisma.paymentRow.findMany({
    where: { orgId },
    orderBy: [{ createdAt: "asc" }],
  });

  const invoices = invoicesDb.map((i) => ({ db: i, n: normalizeInvoiceRaw(i.raw as any) }));
  const payments = paymentsDb.map((p) => ({ db: p, n: normalizePaymentRaw(p.raw as any) }));

  // wipe previous results for org (keep it simple for MVP)
  await prisma.reconcileResult.deleteMany({ where: { orgId } });

  for (const inv of invoices) {
    const invAmount = inv.n.total;
    const invCur = inv.n.currency ?? null;

    const invRef = safeLower(inv.n.reference || inv.n.invoiceNumber);
    const invCounterparty = safeLower(inv.n.counterparty);

    let matched: { paymentId: string; reasons: Reason[]; score: number }[] = [];

    for (const pay of payments) {
      const payAmount = pay.n.amount;
      const payCur = pay.n.currency ?? null;

      // must have amount to compare
      if (invAmount === null || payAmount === null) continue;

      let score = 0;
      const reasons: Reason[] = [];

      // Currency match
      if (invCur && payCur && sameCurrency(invCur, payCur)) {
        score += 2;
        reasons.push({ reason: "Currency matches", weight: 2, paymentRowId: pay.db.id });
      }

      // Reference match
      const payRef = safeLower(pay.n.reference);
      if (invRef && payRef && (payRef.includes(invRef) || invRef.includes(payRef))) {
        score += 5;
        reasons.push({ reason: "Reference matches", weight: 5, paymentRowId: pay.db.id });
      }

      // Counterparty match (weak)
      const payCounterparty = safeLower(pay.n.counterparty);
      if (invCounterparty && payCounterparty && (payCounterparty.includes(invCounterparty) || invCounterparty.includes(payCounterparty))) {
        score += 1;
        reasons.push({ reason: "Counterparty matches", weight: 1, paymentRowId: pay.db.id });
      }

      // Amount match (strong)
      const diff = abs(payAmount - invAmount);
      if (diff < 0.0001) {
        score += 6;
        reasons.push({ reason: "Amount matches exactly", weight: 6, paymentRowId: pay.db.id });
      } else if (diff <= Math.max(1, invAmount * 0.01)) {
        score += 3;
        reasons.push({ reason: "Amount close (<=1% or <=1 unit)", weight: 3, paymentRowId: pay.db.id });
      }

      if (score > 0) {
        matched.push({ paymentId: pay.db.id, reasons, score });
      }
    }

    matched.sort((a, b) => b.score - a.score);

    const best = matched[0];
    if (!best) {
      await prisma.reconcileResult.create({
        data: {
          orgId,
          runId: run.id,
          invoiceRowId: inv.db.id,
          status: "unmatched",
          currency: invCur,
          paidTotal: 0,
          outstanding: invAmount ?? null,
          matchReasons: { reasons: [{ reason: "No matching payments found" }] },
        },
      });
      continue;
    }

    // For MVP: take the best payment only
    const bestPay = payments.find((p) => p.db.id === best.paymentId);
    const paid = bestPay?.n.amount ?? 0;

    const outstanding =
      invAmount === null ? null : Math.max(0, (invAmount ?? 0) - (paid ?? 0));

    await prisma.reconcileResult.create({
      data: {
        orgId,
        runId: run.id,
        invoiceRowId: inv.db.id,
        status: outstanding && outstanding > 0 ? "partial" : "matched",
        currency: invCur,
        paidTotal: paid ?? 0,
        outstanding,
        matchReasons: { reasons: best.reasons },
      },
    });
  }

  await prisma.reconcileRun.update({
    where: { id: run.id },
    data: { summary: { finishedAt: new Date().toISOString(), invoices: invoices.length, payments: payments.length } },
  });

  return run;
}
