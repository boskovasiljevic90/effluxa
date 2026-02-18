import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function fmtMoney(amount: any, currency: string | null) {
  const n = typeof amount === "number" ? amount : amount?.toNumber?.() ?? Number(amount ?? 0);
  const fixed = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  return `${fixed} ${currency || ""}`.trim();
}

function fmtDate(d: any) {
  if (!d) return "-";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
}

export default async function VendorDrillPage({
  params,
  searchParams,
}: {
  params: Promise<{ vendor: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId, orgId } = await auth();
  if (!userId) return <div style={{ padding: 24 }}>Not signed in</div>;
  if (!orgId) return <div style={{ padding: 24 }}>Missing org (switch to an Organization)</div>;

  const p = await params;
  const sp = await searchParams;

  const vendor = decodeURIComponent(p.vendor || "");
  const currency = typeof sp.currency === "string" ? sp.currency : "";
  const days = typeof sp.days === "string" ? Number(sp.days) : 90;
  const runId = typeof sp.runId === "string" ? sp.runId : undefined;

  const run =
    (runId ? await prisma.reconcileRun.findFirst({ where: { id: runId, orgId } }) : null) ||
    (await prisma.reconcileRun.findFirst({ where: { orgId }, orderBy: { createdAt: "desc" } }));

  if (!run) return <div style={{ padding: 24 }}>No reconcile run found.</div>;

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - (Number.isFinite(days) ? days : 90));

  const results = await prisma.reconcileResult.findMany({
    where: {
      orgId,
      runId: run.id,
      invoiceRow: {
        is: {
          counterparty: vendor,
          ...(currency ? { currency } : {}),
          ...(since ? { invoiceDate: { gte: since } } : {}),
        },
      },
    },
    include: { invoiceRow: true },
    orderBy: [{ createdAt: "asc" }],
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>Vendor</div>
          <div style={{ marginTop: 6, opacity: 0.8 }}>
            <b>{vendor}</b>
            {currency ? <> • Currency: <b>{currency}</b></> : null}
            <> • Window: last <b>{Number.isFinite(days) ? days : 90}</b> days</>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/app/dashboard"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              fontWeight: 900,
              background: "white",
              color: "#111827",
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 8 }}>Invoices</div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Invoice</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Inv date</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Status</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Currency</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Paid</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Outstanding</th>
              <th style={{ textAlign: "right", padding: 12, fontSize: 12, opacity: 0.8 }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r: any) => {
              const inv = r.invoiceRow || {};
              return (
                <tr key={r.id} style={{ borderTop: "1px solid #eef2f7" }}>
                  <td style={{ padding: 12, fontWeight: 950 }}>{inv.invoiceNo ?? "-"}</td>
                  <td style={{ padding: 12 }}>{fmtDate(inv.invoiceDate ?? null)}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>{r.status}</td>
                  <td style={{ padding: 12 }}>{r.currency ?? "-"}</td>
                  <td style={{ padding: 12 }}>{fmtMoney(r.paidTotal, r.currency ?? null)}</td>
                  <td style={{ padding: 12 }}>{fmtMoney(r.outstanding, r.currency ?? null)}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <a
                      href={`/app/results/${inv.id}?runId=${run.id}`}
                      style={{
                        textDecoration: "none",
                        padding: "8px 12px",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontWeight: 900,
                        color: "#111827",
                        background: "white",
                      }}
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {results.length === 0 ? (
          <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, opacity: 0.75 }}>
            No rows for this vendor with current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
