import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VendorPage({ params, searchParams }: any) {
  const vendor = params.vendor;
  const currency = searchParams?.currency || null;
  const since = searchParams?.since ? new Date(searchParams.since) : null;

  // Fetch results, then hydrate invoice rows manually (no Prisma relation in schema)
  const results = (await prisma.reconcileResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  })) as any[];

  const invoiceRowIds = Array.from(
    new Set(results.map((r) => r.invoiceRowId).filter(Boolean))
  ) as string[];

  const invoiceRows = invoiceRowIds.length
    ? ((await prisma.invoiceRow.findMany({
        where: { id: { in: invoiceRowIds } },
      })) as any[])
    : [];

  const invoiceById = new Map<string, any>(invoiceRows.map((r) => [r.id, r]));

  const hydrated = results.map((r) => ({
    ...r,
    invoiceRow: r.invoiceRowId ? invoiceById.get(r.invoiceRowId) : null,
  }));

  const filtered = hydrated.filter((r: any) => {
    const raw = r.invoiceRow?.raw;
    if (!raw) return false;

    if (vendor && raw.counterparty !== vendor) return false;
    if (currency && raw.currency !== currency) return false;
    if (since && raw.invoiceDate) {
      const d = new Date(raw.invoiceDate);
      if (d < since) return false;
    }

    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor: {vendor}</h1>

      <div style={{ marginTop: 20 }}>
        {filtered.map((r: any) => (
          <div
            key={r.id}
            style={{
              padding: 12,
              marginBottom: 10,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <div>Status: {r.status}</div>
            <div>Currency: {r.currency || "-"}</div>
            <div>Paid: {r.paidTotal ?? "-"}</div>
            <div>Outstanding: {r.outstanding ?? "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
