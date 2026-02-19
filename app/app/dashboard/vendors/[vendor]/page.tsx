import { prisma } from "../../../../lib/prisma";

export default async function VendorPage({ params }: any) {
  const vendor = params.vendor;

  const results = await prisma.reconcileResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        Vendor: {vendor}
      </h1>

      <div style={{ marginTop: 20 }}>
        {results.map((r: any) => (
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
