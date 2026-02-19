import { prisma } from "../../../../../lib/prisma";

export default async function VendorPage({ params, searchParams }: any) {
  const vendor = params.vendor;
  const currency = searchParams?.currency || null;
  const since = searchParams?.since ? new Date(searchParams.since) : null;

  const results = await prisma.reconcileResult.findMany({
    include: {
      invoiceRow: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const filtered = results.filter((r: any) => {
    if (!r.invoiceRow?.raw) return false;

    const raw = r.invoiceRow.raw as any;

    if (vendor && raw?.counterparty !== vendor) return false;
    if (currency && raw?.currency !== currency) return false;
    if (since && raw?.invoiceDate) {
      const d = new Date(raw.invoiceDate);
      if (d < since) return false;
    }

    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        Vendor: {vendor}
      </h1>

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
            <div>Currency: {r.currency}</div>
            <div>Paid: {r.paidTotal}</div>
            <div>Outstanding: {r.outstanding}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
