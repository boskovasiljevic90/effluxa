import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";

function fmtMoney(amount: any, currency: string | null) {
  const n =
    typeof amount === "number"
      ? amount
      : amount?.toNumber?.() ?? Number(amount ?? 0);
  const cur = currency || "";
  const fixed = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  return `${fixed} ${cur}`.trim();
}

function fmtDate(d: any) {
  if (!d) return "-";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
}

function pill(status: string) {
  const bg =
    status === "PAID"
      ? "#16a34a"
      : status === "PARTIAL"
      ? "#f59e0b"
      : status === "OVERPAID"
      ? "#0ea5e9"
      : status === "MISMATCH"
      ? "#a855f7"
      : "#ef4444";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        color: "white",
        fontSize: 12,
        fontWeight: 900,
        background: bg,
      }}
    >
      {status}
    </span>
  );
}

type MatchReason = { type?: string; note?: string; paymentRowId?: string };

export default async function InvoiceDrillDownPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceRowId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await params;
  const sp = await searchParams;

  const invoiceRowId = p.invoiceRowId;
  const runId = typeof sp.runId === "string" ? sp.runId : undefined;

  const { userId, orgId } = await auth();

  if (!userId) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Invoice drill-down</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          You are not signed in.
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Invoice drill-down</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          Missing organization. Switch to an Organization in Clerk and retry.
        </div>
      </div>
    );
  }

  const run =
    (runId ? await prisma.reconcileRun.findFirst({ where: { id: runId, orgId } }) : null) ||
    (await prisma.reconcileRun.findFirst({ where: { orgId }, orderBy: { createdAt: "desc" } }));

  if (!run) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Invoice drill-down</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          No runs found. Go to <a href="/app/upload">Upload</a>.
        </div>
      </div>
    );
  }

  // ✅ CRITICAL FIX: fetch EXACT invoiceRowId for this run/org
  const result = await prisma.reconcileResult.findFirst({
    where: { orgId, runId: run.id, invoiceRowId },
    include: { invoiceRow: true },
  });

  if (!result) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Invoice drill-down</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          Not found for this run/invoice. Back to <a href={`/app/results?runId=${run.id}`}>Results</a>.
        </div>
      </div>
    );
  }

  const inv: any = result.invoiceRow || {};
  const matched: any[] = Array.isArray(result.matchedPayments) ? (result.matchedPayments as any[]) : [];
  const reasons: MatchReason[] = Array.isArray((result as any).matchReasons) ? ((result as any).matchReasons as any[]) : [];

  const paymentIds = Array.from(new Set(matched.map((m) => m.paymentRowId).filter(Boolean)));
  const payments = paymentIds.length
    ? await prisma.paymentRow.findMany({
        where: { orgId, id: { in: paymentIds } },
        select: { id: true, reference: true, amount: true, currency: true, paymentDate: true, raw: true },
      })
    : [];

  const payMap = new Map<string, any>();
  for (const p of payments) payMap.set(p.id, p);

  const isDev = process.env.NODE_ENV !== "production";

  // group reasons per paymentRowId for nicer display
  const reasonsByPayment = new Map<string, MatchReason[]>();
  for (const r of reasons) {
    const pid = r.paymentRowId || "(invoice)";
    const arr = reasonsByPayment.get(pid) || [];
    arr.push(r);
    reasonsByPayment.set(pid, arr);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ fontSize: 26, fontWeight: 950 }}>Invoice drill-down</div>
      <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
        runId: <b>{run.id}</b> • invoiceRowId: <b>{invoiceRowId}</b>
      </div>

      <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <b>Invoice No:</b> {inv.invoiceNo ?? "-"}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Amount:</b> {fmtMoney(inv.amount ?? 0, inv.currency ?? result.currency ?? null)}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Paid Total:</b> {fmtMoney(result.paidTotal ?? 0, result.currency ?? inv.currency ?? null)}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>
              <b>Invoice Date:</b> {fmtDate(inv.invoiceDate ?? null)}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Status:</b> {pill(String(result.status))}
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Outstanding:</b> {fmtMoney(result.outstanding ?? 0, result.currency ?? inv.currency ?? null)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 16, fontWeight: 900 }}>Matched payments</div>

      <div style={{ marginTop: 10, border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Payment Ref</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Payment Date</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Payment Amount</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Used on this invoice</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Currency</th>
            </tr>
          </thead>

          <tbody>
            {matched.length ? (
              matched.map((m, idx) => {
                const p = m?.paymentRowId ? payMap.get(m.paymentRowId) : null;
                return (
                  <tr key={`${m.paymentRowId || "x"}-${idx}`} style={{ borderTop: "1px solid #eef2f7" }}>
                    <td style={{ padding: 12, fontWeight: 800 }}>{p?.reference ?? "-"}</td>
                    <td style={{ padding: 12 }}>{fmtDate(p?.paymentDate ?? null)}</td>
                    <td style={{ padding: 12 }}>{fmtMoney(p?.amount ?? 0, p?.currency ?? null)}</td>
                    <td style={{ padding: 12, fontWeight: 900 }}>{fmtMoney(Number(m.amountUsed ?? 0), p?.currency ?? null)}</td>
                    <td style={{ padding: 12 }}>{p?.currency ?? "-"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: 14, opacity: 0.7 }}>
                  No matched payments for this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Reason engine output (DEV only) */}
      {isDev ? (
        <div style={{ marginTop: 18, border: "1px dashed #e5e7eb", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 950, marginBottom: 10 }}>Match reasons (DEV)</div>

          {Array.from(reasonsByPayment.entries()).map(([pid, arr]) => {
            const p = pid !== "(invoice)" ? payMap.get(pid) : null;
            return (
              <div key={pid} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.9 }}>
                  {pid === "(invoice)"
                    ? "Invoice-level reasons"
                    : `Payment ${p?.reference ?? pid} (id: ${pid})`}
                </div>

                <ul style={{ marginTop: 6, marginBottom: 0 }}>
                  {arr.map((r, i) => (
                    <li key={`${pid}-${i}`} style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
                      <b>{r.type ?? "REASON"}:</b> {r.note ?? "-"}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {!reasons.length ? (
            <div style={{ opacity: 0.7, fontSize: 13 }}>No matchReasons recorded.</div>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <a
          href={`/app/results?runId=${run.id}`}
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            textDecoration: "none",
            fontWeight: 900,
            color: "#111827",
            background: "white",
          }}
        >
          ← Back to Results
        </a>
      </div>
    </div>
  );
}
