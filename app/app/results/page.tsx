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

function fmtDate(d: any) {
  if (!d) return "-";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
}

function StatusPill({ status }: { status: Status }) {
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

function parseStatuses(v: string | null | undefined): Status[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean)
    .filter((x) =>
      ["PAID", "PARTIAL", "UNPAID", "OVERPAID", "MISMATCH"].includes(x)
    ) as Status[];
}

function buildStatusCounts(rows: { status: Status }[]) {
  const counts = {
    PAID: 0,
    PARTIAL: 0,
    UNPAID: 0,
    OVERPAID: 0,
    MISMATCH: 0,
  } as Record<Status, number>;
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  return counts;
}

/**
 * ✅ COMMERCIAL explanation:
 * - Always show a simple, user-friendly one-liner that matches the STATUS only.
 * - No internal "checks" list.
 */
function explanationSummary(status: Status, paidTotal: any, outstanding: any, currency: string | null) {
  const paid = fmtMoney(paidTotal, currency);
  const out = fmtMoney(outstanding, currency);

  if (status === "PAID") return `Paid in full. Outstanding: ${out}.`;
  if (status === "PARTIAL") return `Partially paid. Paid: ${paid}. Outstanding: ${out}.`;
  if (status === "OVERPAID") return `Overpaid. Paid: ${paid}. Outstanding: ${out}.`;
  if (status === "MISMATCH") return `Mismatch detected. Please review details.`;
  return `Unpaid. Outstanding: ${out}.`;
}

/**
 * ✅ STATUS-scoped DETAILS:
 * We only keep lines that make sense for that status.
 * (We filter by keywords, not raw "type" codes, so it's robust.)
 */
function detailsLinesForStatus(status: Status, matchReasons: any): string[] {
  const arr = Array.isArray(matchReasons) ? matchReasons : [];
  const notes = arr
    .map((r: any) => (r?.note ?? "").toString().trim())
    .filter(Boolean);

  if (!notes.length) return [];

  // Helper for keyword matching
  const has = (s: string, kws: string[]) => kws.some((k) => s.toLowerCase().includes(k));

  const PAID_KW = ["considered paid", "paid in full", "outstanding=0", "tolerance", "used full", "used partial", "applied", "payment"];
  const PARTIAL_KW = ["partial", "outstanding", "used", "applied", "remaining", "payment"];
  const UNPAID_KW = ["no candidate", "no remaining", "no payments", "cannot be applied", "unpaid", "no match"];
  const OVERPAID_KW = ["overpaid", "negative", "extra", "excess", "more than"];
  const MISMATCH_KW = ["mismatch", "currency", "date", "reference", "not matched"];

  let keep: string[] = [];

  if (status === "PAID") {
    keep = notes.filter((n) => has(n, PAID_KW));
    // Prefer the most "final" explanations if present
    const finals = keep.filter((n) => n.toLowerCase().includes("considered paid"));
    if (finals.length) return finals.slice(0, 3);
    return keep.slice(0, 6);
  }

  if (status === "PARTIAL") {
    keep = notes.filter((n) => has(n, PARTIAL_KW));
    // keep the most useful 4-6 lines
    return keep.slice(0, 6);
  }

  if (status === "OVERPAID") {
    keep = notes.filter((n) => has(n, OVERPAID_KW));
    return keep.length ? keep.slice(0, 6) : notes.slice(0, 3);
  }

  if (status === "MISMATCH") {
    keep = notes.filter((n) => has(n, MISMATCH_KW));
    return keep.length ? keep.slice(0, 6) : notes.slice(0, 4);
  }

  // UNPAID
  keep = notes.filter((n) => has(n, UNPAID_KW));
  return keep.length ? keep.slice(0, 6) : notes.slice(0, 3);
}

/**
 * ✅ GROUPING (Commercial default):
 * group by invoiceNo and keep the latest createdAt (so duplicates disappear).
 */
function groupByInvoiceNoKeepLatest(rows: any[]) {
  const map = new Map<string, any>();

  for (const r of rows) {
    const invNo = String(r.invoiceRow?.invoiceNo ?? "").trim();
    const key = invNo ? `inv:${invNo}` : `id:${r.id}`;
    const prev = map.get(key);

    const rTime = new Date(r.createdAt ?? 0).getTime();
    const pTime = prev ? new Date(prev.createdAt ?? 0).getTime() : -1;

    if (!prev || rTime >= pTime) map.set(key, r);
  }

  // Stable ordering: invoiceNo asc, then createdAt asc
  const out = Array.from(map.values());
  out.sort((a, b) => {
    const an = String(a.invoiceRow?.invoiceNo ?? "");
    const bn = String(b.invoiceRow?.invoiceNo ?? "");
    if (an < bn) return -1;
    if (an > bn) return 1;
    return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
  });

  return out;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const runId = typeof sp.runId === "string" ? sp.runId : undefined;
  const q = typeof sp.q === "string" ? sp.q : "";
  const statuses = parseStatuses(typeof sp.status === "string" ? sp.status : undefined);

  // DEV toggle: only if ?dev=1
  const isDevMode = sp.dev === "1";

  const { userId, orgId } = await auth();

  if (!userId) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Reconciliation Results</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          You are not signed in.
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Reconciliation Results</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          Missing organization. Switch from Personal to an Organization in the Clerk UI (top-right) and retry.
        </div>
      </div>
    );
  }

  // Choose run:
  const run =
    (runId
      ? await prisma.reconcileRun.findFirst({ where: { id: runId, orgId } })
      : null) ||
    (await prisma.reconcileRun.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }));

  if (!run) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Reconciliation Results</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          No reconciliation runs found yet. Go to <a href="/app/upload">Upload</a> and click “Run reconciliation”.
        </div>
      </div>
    );
  }

  // Fetch results + invoice info
  const rawResults = await prisma.reconcileResult.findMany({
    where: {
      orgId,
      runId: run.id,
      ...(statuses.length ? { status: { in: statuses } } : {}),
    },
    include: { invoiceRow: true },
    orderBy: [{ createdAt: "asc" }],
  });

  // ✅ Commercial view is GROUPED, Dev view is RAW
  const baseResults = isDevMode ? rawResults : groupByInvoiceNoKeepLatest(rawResults);

  // Search: invoiceNo OR notes OR currency OR explanation (summary) OR reason details lines
  const qNorm = (q || "").toLowerCase().trim();
  const filtered = qNorm
    ? baseResults.filter((r: any) => {
        const invNo = String(r.invoiceRow?.invoiceNo ?? "").toLowerCase();
        const notes = String(r.notes ?? "").toLowerCase();
        const currency = String(r.currency ?? "").toLowerCase();

        const summary = explanationSummary(r.status, r.paidTotal, r.outstanding, r.currency ?? null).toLowerCase();
        const detailLines = detailsLinesForStatus(r.status, r.matchReasons).join("\n").toLowerCase();

        return (
          invNo.includes(qNorm) ||
          notes.includes(qNorm) ||
          currency.includes(qNorm) ||
          summary.includes(qNorm) ||
          detailLines.includes(qNorm)
        );
      })
    : baseResults;

  const countsAll = buildStatusCounts(baseResults as any);
  const countsShown = buildStatusCounts(filtered as any);

  function withParams(p: Record<string, string | undefined>) {
    const u = new URL("http://local/app/results");

    // pin runId
    if (run?.id) u.searchParams.set("runId", run.id);

    // keep dev toggle
    if (isDevMode) u.searchParams.set("dev", "1");

    const nextQ = p.q ?? q;
    if (nextQ) u.searchParams.set("q", nextQ);
    else u.searchParams.delete("q");

    const nextStatus = p.status ?? (statuses.length ? statuses.join(",") : "");
    if (nextStatus) u.searchParams.set("status", nextStatus);
    else u.searchParams.delete("status");

    const s = u.searchParams.toString();
    return "/app/results" + (s ? `?${s}` : "");
  }

  const toggleStatusLink = (s: Status) => {
    const set = new Set(statuses);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    const next = Array.from(set).join(",");
    return withParams({ status: next || undefined });
  };

  const toggleDevLink = () => {
    if (isDevMode) {
      const u = new URL("http://local/app/results");
      if (run?.id) u.searchParams.set("runId", run.id);
      if (q) u.searchParams.set("q", q);
      if (statuses.length) u.searchParams.set("status", statuses.join(","));
      const s = u.searchParams.toString();
      return "/app/results" + (s ? `?${s}` : "");
    }
    return withParams({}) + (withParams({}).includes("?") ? "&dev=1" : "?dev=1");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>Reconciliation Results</div>
          <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
            Run: <b>{run.id}</b> • Finished:{" "}
            <b>
              {(run as any).summary?.finishedAt
                ? String((run as any).summary.finishedAt).slice(0, 19).replace("T", " ")
                : "-"}
            </b>
          </div>
          <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
            MODE: <b>{isDevMode ? "RAW (DEV)" : "GROUPED (COMMERCIAL)"}</b> • RAW: <b>{rawResults.length}</b> • SHOWN: <b>{filtered.length}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/app/upload"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              fontWeight: 800,
              background: "white",
            }}
          >
            ← Back to Upload
          </a>
        </div>
      </div>

      {/* KPI bar */}
      <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["PAID", "PARTIAL", "UNPAID", "OVERPAID", "MISMATCH"] as Status[]).map((s) => {
            const active = statuses.includes(s);
            return (
              <a
                key={s}
                href={toggleStatusLink(s)}
                style={{
                  textDecoration: "none",
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  fontWeight: 900,
                  background: active ? "#111827" : "white",
                  color: active ? "white" : "#111827",
                }}
              >
                {s}: {countsAll[s]}
              </a>
            );
          })}
        </div>

        <div style={{ marginLeft: "auto" }}>
          <a
            href={toggleDevLink()}
            style={{
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              fontSize: 12,
              fontWeight: 900,
              background: isDevMode ? "#111827" : "white",
              color: isDevMode ? "white" : "#111827",
            }}
          >
            {isDevMode ? "DEV: ON" : "DEV: OFF"}
          </a>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <form action="/app/results" method="GET" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="hidden" name="runId" value={run.id} />
          {isDevMode ? <input type="hidden" name="dev" value="1" /> : null}
          {statuses.length ? <input type="hidden" name="status" value={statuses.join(",")} /> : null}

          <input
            name="q"
            defaultValue={q}
            placeholder="Search invoice / notes / currency / explanation..."
            style={{
              width: 420,
              maxWidth: "90vw",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />

          <button
            type="submit"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Search
          </button>

          <a href={withParams({ q: undefined })} style={{ fontSize: 13, textDecoration: "none", opacity: 0.8 }}>
            Clear
          </a>
        </form>
      </div>

      {/* Table */}
      <div style={{ marginTop: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Invoice</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Inv date</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Status</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Paid</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Outstanding</th>
              <th style={{ textAlign: "left", padding: 12, fontSize: 12, opacity: 0.8 }}>Explanation</th>
              <th style={{ textAlign: "right", padding: 12, fontSize: 12, opacity: 0.8 }}>View</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r: any) => {
              const inv = r.invoiceRow || {};
              const summary = explanationSummary(r.status, r.paidTotal, r.outstanding, r.currency ?? null);
              const lines = detailsLinesForStatus(r.status, r.matchReasons);
              const hasDetails = lines.length > 0;

              return (
                <tr key={r.id} style={{ borderTop: "1px solid #eef2f7", verticalAlign: "top" }}>
                  <td style={{ padding: 12, fontWeight: 900 }}>{inv.invoiceNo ?? "-"}</td>
                  <td style={{ padding: 12 }}>{fmtDate(inv.invoiceDate ?? null)}</td>
                  <td style={{ padding: 12 }}>
                    <StatusPill status={r.status} />
                  </td>
                  <td style={{ padding: 12 }}>{fmtMoney(r.paidTotal, r.currency ?? null)}</td>
                  <td style={{ padding: 12 }}>{fmtMoney(r.outstanding, r.currency ?? null)}</td>

                  <td style={{ padding: 12, minWidth: 420 }}>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>{summary}</div>

                    {hasDetails ? (
                      <details style={{ marginTop: 8 }}>
                        <summary
                          style={{
                            listStyle: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontWeight: 900,
                            border: "1px solid #e5e7eb",
                            borderRadius: 999,
                            padding: "6px 12px",
                            background: "#fff",
                            userSelect: "none",
                          }}
                        >
                          <span aria-hidden="true">ℹ️</span> Details
                        </summary>

                        <div
                          style={{
                            marginTop: 10,
                            padding: 12,
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            background: "#f9fafb",
                            maxWidth: 780,
                            whiteSpace: "pre-wrap",
                            fontSize: 13,
                            lineHeight: 1.5,
                          }}
                        >
                          {lines.join("\n")}

                          {isDevMode ? (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.7 }}>
                                DEV raw reasons:
                              </div>
                              <pre
                                style={{
                                  marginTop: 6,
                                  padding: 10,
                                  borderRadius: 10,
                                  background: "#f3f4f6",
                                  fontSize: 11,
                                  overflowX: "auto",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {JSON.stringify(r.matchReasons, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    ) : null}
                  </td>

                  <td style={{ padding: 12, textAlign: "right" }}>
                    <a
                      href={`/app/results/${inv.id}?runId=${run.id}${isDevMode ? "&dev=1" : ""}`}
                      style={{
                        textDecoration: "none",
                        fontWeight: 900,
                        padding: "8px 14px",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background: "white",
                        display: "inline-block",
                      }}
                    >
                      View
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
