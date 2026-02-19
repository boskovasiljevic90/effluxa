import { prisma } from "../../../lib/prisma";

export default async function DashboardPage() {
  const orgId = "demo";

  const run = await prisma.reconcileRun.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  if (!run) {
    return <div style={{ padding: 24 }}>No reconciliation runs yet.</div>;
  }

  const results = await prisma.reconcileResult.findMany({
    where: { orgId, runId: run.id },
    orderBy: [{ createdAt: "asc" }],
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1>

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
