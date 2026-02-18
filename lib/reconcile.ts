import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

const AMOUNT_TOLERANCE_PERCENT = 0.01; // 1%
const AMOUNT_TOLERANCE_ABS = 1.0; // 1 currency unit
const DATE_BEFORE_DAYS = 7;
const DATE_AFTER_DAYS = 90;

function dec(n: any) {
  if (n instanceof Decimal) return n;
  if (n === null || n === undefined || n === "") return new Decimal(0);
  return new Decimal(n);
}

function absDecimal(a: Decimal) {
  return a.lessThan(0) ? a.mul(-1) : a;
}

function tolerance(due: Decimal) {
  const pct = due.mul(AMOUNT_TOLERANCE_PERCENT);
  const abs = new Decimal(AMOUNT_TOLERANCE_ABS);
  return pct.greaterThan(abs) ? pct : abs;
}

function inDateWindow(invoiceDate: Date | null, paymentDate: Date | null) {
  if (!invoiceDate || !paymentDate) return true; // if missing dates, don't block
  const before = new Date(invoiceDate);
  before.setDate(before.getDate() - DATE_BEFORE_DAYS);
  const after = new Date(invoiceDate);
  after.setDate(after.getDate() + DATE_AFTER_DAYS);
  return paymentDate >= before && paymentDate <= after;
}

function normalizeStr(s: string | null) {
  return (s || "").toLowerCase().trim();
}

function referenceHit(invoiceNo: string | null, paymentRef: string | null) {
  const inv = normalizeStr(invoiceNo);
  const ref = normalizeStr(paymentRef);
  if (!inv || !ref) return false;
  return ref.includes(inv) || inv.includes(ref);
}

type MatchedPayment = {
  paymentRowId: string;
  amountUsed: string; // decimal string
};

type MatchReason = {
  type: string;
  note: string;
  paymentRowId?: string;
};

export async function runReconciliation(orgId: string) {
  const run = await prisma.reconcileRun.create({
    data: { orgId, summary: { startedAt: new Date().toISOString() } },
  });

  const invoices = await prisma.invoiceRow.findMany({
    where: { orgId },
    orderBy: [{ invoiceDate: "asc" }, { createdAt: "asc" }],
  });

  const payments = await prisma.paymentRow.findMany({
    where: { orgId },
    orderBy: [{ paymentDate: "asc" }, { createdAt: "asc" }],
  });

  // Remaining amount per payment (allows partial usage)
  const paymentRemaining = new Map<string, Decimal>();
  for (const p of payments as any[]) {
    paymentRemaining.set(p.id, dec(p.amount));
  }

  let paidCount = 0,
    partialCount = 0,
    unpaidCount = 0,
    overpaidCount = 0,
    mismatchCount = 0;

  for (const inv of invoices as any[]) {
    const invoiceAmount = dec(inv.amount);
    const invTol = tolerance(invoiceAmount);

    let paidTotal = new Decimal(0);
    let outstanding = invoiceAmount;
    const matched: MatchedPayment[] = [];
    const matchReasons: MatchReason[] = [];

    // candidates are: date window (+currency if present)
    const candidates = (payments as any[]).filter((p) => {
      if (!inDateWindow(inv.invoiceDate ?? null, p.paymentDate ?? null)) return false;
      if (inv.currency && p.currency && inv.currency !== p.currency) return false;
      return true;
    });

    // If there is a reference-hit candidate set, we'll prefer those first
    const refCandidates = candidates.filter((p) => referenceHit(inv.invoiceNo ?? null, p.reference ?? null));
    const nonRefCandidates = candidates.filter((p) => !referenceHit(inv.invoiceNo ?? null, p.reference ?? null));
    const merged = [...refCandidates, ...nonRefCandidates];

    if (inv.invoiceNo) {
      matchReasons.push({
        type: "INVOICE_NO",
        note: `Invoice number present: ${String(inv.invoiceNo)}`,
      });
    }

    if (inv.invoiceDate) {
      matchReasons.push({
        type: "INVOICE_DATE",
        note: `Invoice date: ${new Date(inv.invoiceDate).toISOString().slice(0, 10)} (window -${DATE_BEFORE_DAYS}/+${DATE_AFTER_DAYS} days)`,
      });
    } else {
      matchReasons.push({
        type: "INVOICE_DATE_MISSING",
        note: "Invoice date missing — date window filter not applied.",
      });
    }

    if (inv.currency) {
      matchReasons.push({
        type: "CURRENCY_INVOICE",
        note: `Invoice currency: ${String(inv.currency)}`,
      });
    } else {
      matchReasons.push({
        type: "CURRENCY_INVOICE_MISSING",
        note: "Invoice currency missing — currency filter not applied.",
      });
    }

    if (refCandidates.length) {
      matchReasons.push({
        type: "REF_HIT_CANDIDATES",
        note: `Found ${refCandidates.length} candidate payment(s) with reference hit.`,
      });
      for (const p of refCandidates) {
        matchReasons.push({
          type: "REF_HIT",
          note: `Reference hit: payment reference "${String(p.reference ?? "")}" contains invoice "${String(inv.invoiceNo ?? "")}" (or vice versa).`,
          paymentRowId: p.id,
        });
      }
    } else {
      matchReasons.push({
        type: "REF_HIT_NONE",
        note: "No candidate payments matched invoice reference.",
      });
    }

    let hadReferenceButMismatch = false;

    // Greedy matching: repeatedly pick the payment whose REMAINING is closest to OUTSTANDING
    // and apply min(remaining, outstanding)
    while (outstanding.greaterThan(invTol)) {
      let bestId: string | null = null;
      let bestDiff: Decimal | null = null;

      for (const p of merged) {
        const remaining = paymentRemaining.get(p.id) || new Decimal(0);
        if (remaining.lessThanOrEqualTo(0)) continue;

        // currency mismatch safety
        if (inv.currency && p.currency && inv.currency !== p.currency) {
          if (referenceHit(inv.invoiceNo ?? null, p.reference ?? null)) hadReferenceButMismatch = true;
          matchReasons.push({
            type: "CURRENCY_MISMATCH",
            note: `Skipped payment due to currency mismatch (inv=${inv.currency}, pay=${p.currency}).`,
            paymentRowId: p.id,
          });
          continue;
        }

        const diff = absDecimal(remaining.sub(outstanding));
        if (!bestDiff || diff.lessThan(bestDiff)) {
          bestDiff = diff;
          bestId = p.id;
        }
      }

      if (!bestId) break; // nothing usable left

      const bestPayment = (payments as any[]).find((p) => p.id === bestId) as any;
      const remaining = paymentRemaining.get(bestId) || new Decimal(0);
      if (remaining.lessThanOrEqualTo(0)) break;

      // date window info (informational; candidates already passed)
      if (!inDateWindow(inv.invoiceDate ?? null, bestPayment?.paymentDate ?? null)) {
        matchReasons.push({
          type: "DATE_OUTSIDE",
          note: "Payment was outside date window (should not happen due to candidate filter).",
          paymentRowId: bestId,
        });
      } else {
        matchReasons.push({
          type: "DATE_OK",
          note: "Payment is within date window.",
          paymentRowId: bestId,
        });
      }

      // amount closeness info
      const diffBefore = absDecimal(remaining.sub(outstanding));
      matchReasons.push({
        type: "AMOUNT_CLOSE",
        note: `Chose payment with remaining=${remaining.toFixed(2)} closest to outstanding=${outstanding.toFixed(2)} (diff=${diffBefore.toFixed(2)}).`,
        paymentRowId: bestId,
      });

      const use = remaining.greaterThan(outstanding) ? outstanding : remaining;

      if (use.lessThan(remaining)) {
        matchReasons.push({
          type: "PARTIAL_USE",
          note: `Used partial amount ${use.toFixed(2)} from payment remaining ${remaining.toFixed(2)}.`,
          paymentRowId: bestId,
        });
      } else {
        matchReasons.push({
          type: "FULL_USE",
          note: `Used full remaining amount ${use.toFixed(2)} from payment.`,
          paymentRowId: bestId,
        });
      }

      paidTotal = paidTotal.add(use);
      outstanding = invoiceAmount.sub(paidTotal);

      paymentRemaining.set(bestId, remaining.sub(use));
      matched.push({ paymentRowId: bestId, amountUsed: use.toFixed(2) });
    }

    // Determine status
    let status: "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID" | "MISMATCH" = "UNPAID";

    if (paidTotal.lessThanOrEqualTo(0)) {
      status = hadReferenceButMismatch ? "MISMATCH" : "UNPAID";
      if (status === "MISMATCH") {
        matchReasons.push({
          type: "MISMATCH",
          note: "Reference matched a payment but it was unusable (currency mismatch or filtered out).",
        });
      } else {
        matchReasons.push({
          type: "NO_REMAINING",
          note: "No remaining payment balance could be applied to this invoice.",
        });
      }
    } else if (outstanding.lessThanOrEqualTo(invTol)) {
      status = outstanding.lessThan(0) ? "OVERPAID" : "PAID";
      matchReasons.push({
        type: status === "OVERPAID" ? "OVERPAID" : "PAID",
        note: `Invoice considered ${status}. outstanding=${outstanding.toFixed(2)} tolerance=${invTol.toFixed(2)}.`,
      });
    } else {
      status = "PARTIAL";
      matchReasons.push({
        type: "PARTIAL",
        note: `Invoice partially paid. outstanding=${outstanding.toFixed(2)} tolerance=${invTol.toFixed(2)}.`,
      });
    }

    if (status === "PAID") paidCount++;
    if (status === "PARTIAL") partialCount++;
    if (status === "UNPAID") unpaidCount++;
    if (status === "OVERPAID") overpaidCount++;
    if (status === "MISMATCH") mismatchCount++;

    await prisma.reconcileResult.upsert({
      where: { runId_invoiceRowId: { runId: run.id, invoiceRowId: inv.id } },
      update: {
        status,
        matchedPayments: matched,
        matchReasons,
        paidTotal,
        outstanding,
        currency: inv.currency || null,
        notes: hadReferenceButMismatch ? "Reference matched but currency mismatch (or unusable)." : null,
      },
      create: {
        orgId,
        runId: run.id,
        invoiceRowId: inv.id,
        status,
        matchedPayments: matched,
        matchReasons,
        paidTotal,
        outstanding,
        currency: inv.currency || null,
        notes: hadReferenceButMismatch ? "Reference matched but currency mismatch (or unusable)." : null,
      },
    });
  }

  const summary = {
    finishedAt: new Date().toISOString(),
    counts: { paid: paidCount, partial: partialCount, unpaid: unpaidCount, overpaid: overpaidCount, mismatch: mismatchCount },
  };

  await prisma.reconcileRun.update({ where: { id: run.id }, data: { summary } });

  return {
    runId: run.id,
    summary,
    invoicesCount: invoices.length,
    paymentsCount: payments.length,
  };
}
