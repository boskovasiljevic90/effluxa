import { prisma } from "@/lib/prisma";

export default async function ResultsPage() {
  const results = await prisma.reconcileResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>
        Reconciliation Results
      </h1>

      {results.length === 0 && (
        <div style={{ marginTop: 20 }}>
          No results yet.
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        {results.map((r) => (
          <div
            key={r.id}
            style={{
              padding: 16,
              marginBottom: 12,
              border: "1px solid #eee",
              borderRadius: 8,
            }}
          >
            <div>Status: {r.status}</div>
            <div>Currency: {r.currency || "-"}</div>
            <div>Paid: {r.paidTotal ?? "-"}</div>
            <div>Outstanding: {r.outstanding ?? "-"}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              Org: {r.orgId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
