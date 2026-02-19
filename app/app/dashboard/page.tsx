import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // TODO: replace with Clerk orgId once auth is stabilized
  const orgId = "demo";

  const run = await prisma.reconcileRun.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  const results = await prisma.reconcileResult.findMany({
    where: { orgId, ...(run?.id ? { runId: run.id } : {}) },
    orderBy: [{ createdAt: "asc" }],
    take: 200,
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Dashboard</h1>

      <div style={{ marginTop: 10, color: "#6b7280" }}>
        Latest run: {run?.id || "(none)"}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Latest results</div>

        {results.map((r: any) => (
          <div
            key={r.id}
            style={{
              padding: 12,
              marginBottom: 10,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
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
