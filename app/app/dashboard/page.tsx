import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";

type Status = "PAID" | "PARTIAL" | "UNPAID" | "OVERPAID" | "MISMATCH";

function fmtMoney(amount: any, currency: string | null) {
  const n =
    typeof amount === "number"
      ? amount
      : amount?.toNumber?.() ?? Number(amount ?? 0);
  const cur = currency || "";
  const fixed = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  return `${fixed} ${cur}`.trim();
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

function safeStr(v: any) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Dashboard</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          You are not signed in.
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Dashboard</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          Missing organization. Switch from Personal to an Organization in the Clerk UI and retry.
        </div>
      </div>
    );
  }

  const run = await prisma.reconcileRun.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  if (!run) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 950 }}>Dashboard</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          No reconciliation runs found yet. Go to <a href="/app/upload">Upload</a> and click “Run reconciliation”.
        </div>
      </div>
    );
  }

  const results = await prisma.reconcileResult.findMany({
    where: { orgId, runId: run.id },
    include: { invoiceRow: true },
    orderBy: [{ createdAt: "asc" }],
  });

  const counts = (run as any).summary?.counts ?? { paid: 0, partial: 0, unpaid: 0, overpaid: 0, mismatch: 0 };
  const total = results.length || 0;

  const paidCount = Number(counts.paid ?? 0);
  const paidRate = total ? paidCount / total : 0;

  let paidTotal = 0;
  let atRiskOutstanding = 0;
  let currencyGuess: string | null = null;

  for (const r of results as any[]) {
    const cur = r.currency ?? r.invoiceRow?.currency ?? null;
    if (!currencyGuess && cur) currencyGuess = cur;

    const paid = Number(r.paidTotal ?? 0);
    const out = Number(r.outstanding ?? 0);

    paidTotal += paid;

    if (r.status === "UNPAID" || r.status === "PARTIAL" || r.status === "MISMATCH") {
      atRiskOutstanding += out;
    }
  }

  // Top unpaid by outstanding
  const topUnpaid = (results as any[])
    .filter((r) => r.status === "UNPAID" || r.status === "PARTIAL")
    .sort((a, b) => Number(b.outstanding ?? 0) - Number(a.outstanding ?? 0))
    .slice(0, 10);

  const finishedAt = (run as any).summary?.finishedAt
    ? String((run as any).summary.finishedAt).slice(0, 19).replace("T", " ")
    : "-";

  function vendorFromInvoiceRow(inv: any) {
    // Prefer raw.vendor (your uploads include vendor column)
    const v = inv?.raw?.vendor ?? inv?.raw?.Vendor ?? inv?.raw?.supplier ?? inv?.raw?.Supplier ?? null;
    const s = safeStr(v);
    return s || "-";
  }

  function vendorLink(vendor: string) {
    if (!vendor || vendor === "-") return null;
    return `/app/dashboard/vendors/${encodeURIComponent(vendor)}`;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 980 }}>Dashboard</div>
          <div style={{ marginTop: 6, opacity: 0.75 }}>
            Latest run: <b>{run.id}</b> • Finished: <b>{finishedAt}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href={`/app/results?runId=${run.id}`}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              fontWeight: 800,
              background: "white",
            }}
          >
            View results →
          </a>
          <a
            href="/app/upload"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              fontWeight: 800,
              background: "white",
            }}
          >
            Upload / Run →
          </a>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 700 }}>Invoices (in run)</div>
          <div style={{ fontSize: 34, fontWeight: 980, marginTop: 6 }}>{total}</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            Summary counts: paid {paidCount}, unpaid {Number(counts.unpaid ?? 0)}
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 700 }}>Paid rate</div>
          <div style={{ fontSize: 34, fontWeight: 980, marginTop: 6 }}>{pct(paidRate)}</div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            {paidCount} paid / {total} total
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 700 }}>Paid total</div>
          <div style={{ fontSize: 30, fontWeight: 980, marginTop: 6 }}>
            {fmtMoney(paidTotal, currencyGuess)}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            Sum of paidTotal across results
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 700 }}>At-risk outstanding</div>
          <div style={{ fontSize: 30, fontWeight: 980, marginTop: 6 }}>
            {fmtMoney(atRiskOutstanding, currencyGuess)}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            UNPAID + PARTIAL + MISMATCH outstanding
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Status breakdown</div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(["PAID", "PARTIAL", "UNPAID", "OVERPAID", "MISMATCH"] as Status[]).map((s) => {
            const n =
              s === "PAID"
                ? Number(counts.paid ?? 0)
                : s === "PARTIAL"
                ? Number(counts.partial ?? 0)
                : s === "UNPAID"
                ? Number(counts.unpaid ?? 0)
                : s === "OVERPAID"
                ? Number(counts.overpaid ?? 0)
                : Number(counts.mismatch ?? 0);

            return (
              <div
                key={s}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  fontWeight: 900,
                  fontSize: 13,
                  background: "white",
                }}
              >
                {s}: {n}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action table */}
      <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Action: Top unpaid invoices</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Invoice</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Vendor</th>
              <th style={{ textAlign: "right", padding: 12, fontSize: 12, opacity: 0.8 }}>Outstanding</th>
              <th style={{ textAlign: "right", padding: 12, fontSize: 12, opacity: 0.8 }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {topUnpaid.map((r: any) => {
              const inv = r.invoiceRow || {};
              const vendor = vendorFromInvoiceRow(inv);
              const vlink = vendorLink(vendor);

              return (
                <tr key={r.id} style={{ borderTop: "1px solid #eef2f7" }}>
                  <td style={{ padding: 12, fontWeight: 900 }}>{inv.invoiceNo ?? "-"}</td>

                  <td style={{ padding: 12 }}>
                    {vlink ? (
                      <a
                        href={vlink}
                        style={{ textDecoration: "none", fontWeight: 800 }}
                        title="Open vendor drill-down"
                      >
                        {vendor} →
                      </a>
                    ) : (
                      <span style={{ opacity: 0.7 }}>{vendor}</span>
                    )}
                  </td>

                  <td style={{ padding: 12, textAlign: "right", fontWeight: 900 }}>
                    {fmtMoney(r.outstanding, r.currency ?? null)}
                  </td>

                  <td style={{ padding: 12, textAlign: "right" }}>
                    <a
                      href={`/app/results/${inv.id}?runId=${run.id}`}
                      style={{ textDecoration: "none", fontWeight: 900 }}
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
