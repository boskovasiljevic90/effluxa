import React from "react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getInvoiceNo(invoiceRow: any): string {
  const raw = invoiceRow?.raw || {};
  return String(
    raw.invoiceNo ??
      raw.invoice_no ??
      raw.invoiceNumber ??
      raw.invoice_number ??
      raw["Invoice No"] ??
      raw["Invoice #"] ??
      raw["Invoice"] ??
      ""
  ).trim();
}

function groupByInvoiceNoKeepLatest(results: any[]) {
  const map = new Map<string, any>();
  for (const r of results) {
    const invoiceNo = getInvoiceNo(r.invoiceRow);
    if (!invoiceNo) continue;

    const prev = map.get(invoiceNo);
    if (!prev) {
      map.set(invoiceNo, r);
      continue;
    }

    const prevDate = new Date(prev.createdAt || 0).getTime();
    const curDate = new Date(r.createdAt || 0).getTime();
    if (curDate > prevDate) map.set(invoiceNo, r);
  }
  return Array.from(map.values());
}

export default async function ResultsPage({ searchParams }: any) {
  const q = String(searchParams?.q || "").trim();
  const currency = String(searchParams?.currency || "").trim();
  const statusCsv = String(searchParams?.status || "").trim();
  const statuses = statusCsv
    ? statusCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Fetch results first (no Prisma relation), then hydrate invoiceRow via invoiceRowId
  const rawResults = (await prisma.reconcileResult.findMany({
    where: {
      ...(currency ? { currency } : {}),
      ...(statuses.length ? { status: { in: statuses } } : {}),
    },
    orderBy: [{ createdAt: "asc" }],
    take: 500,
  })) as any[];

  const invoiceRowIds = Array.from(
    new Set(rawResults.map((r) => r.invoiceRowId).filter(Boolean))
  ) as string[];

  const invoiceRows = invoiceRowIds.length
    ? ((await prisma.invoiceRow.findMany({
        where: { id: { in: invoiceRowIds } },
      })) as any[])
    : [];

  const invoiceById = new Map<string, any>(invoiceRows.map((r) => [r.id, r]));

  const results = rawResults.map((r) => ({
    ...r,
    invoiceRow: r.invoiceRowId ? invoiceById.get(r.invoiceRowId) : null,
  }));

  const uniqueLatestByInvoiceNo = groupByInvoiceNoKeepLatest(results);

  const filtered = uniqueLatestByInvoiceNo.filter((r: any) => {
    const invNo = getInvoiceNo(r.invoiceRow);
    if (q) {
      const hay = [
        invNo,
        String(r.status ?? ""),
        String(r.currency ?? ""),
        JSON.stringify((r as any).notes ?? ""),
        JSON.stringify((r as any).matchReasons ?? ""),
        JSON.stringify(r.invoiceRow?.raw ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const distinctCurrencies = Array.from(
    new Set(
      uniqueLatestByInvoiceNo
        .map((r: any) => r.currency)
        .filter(Boolean)
        .map((c: any) => String(c))
    )
  ).sort();

  const distinctStatuses = Array.from(
    new Set(
      uniqueLatestByInvoiceNo
        .map((r: any) => r.status)
        .filter(Boolean)
        .map((s: any) => String(s))
    )
  ).sort();

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Results</h1>
      <p style={{ marginTop: 6, color: "#6b7280" }}>
        Showing latest reconcile result per invoice number.
      </p>

      <form style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search..."
          style={{
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            minWidth: 240,
          }}
        />

        <select
          name="currency"
          defaultValue={currency}
          style={{
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            minWidth: 160,
          }}
        >
          <option value="">All currencies</option>
          {distinctCurrencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={statusCsv}
          style={{
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            minWidth: 220,
          }}
        >
          <option value="">All statuses</option>
          {distinctStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="submit"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111827",
            background: "#111827",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Apply
        </button>
      </form>

      <div style={{ marginTop: 18, color: "#6b7280" }}>
        {filtered.length} result(s)
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {filtered.map((r: any) => {
          const invNo = getInvoiceNo(r.invoiceRow) || "(no invoice #)";
          return (
            <a
              key={r.id}
              href={`/results/${r.invoiceRowId}`}
              style={{
                display: "block",
                padding: 14,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800 }}>{invNo}</div>
                <div style={{ color: "#6b7280" }}>
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <b>Status:</b> {r.status}
                </div>
                <div>
                  <b>Currency:</b> {r.currency || "-"}
                </div>
                <div>
                  <b>Paid:</b> {r.paidTotal ?? "-"}
                </div>
                <div>
                  <b>Outstanding:</b> {r.outstanding ?? "-"}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
