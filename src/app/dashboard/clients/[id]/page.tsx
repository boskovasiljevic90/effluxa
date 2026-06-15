export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";

async function getUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    return await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
  } catch {
    return null;
  }
}

export default async function ClientDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);

  if (!workspace.hasBusinessAccess) redirect("/dashboard");

  const client = await prisma.client.findFirst({
    where: {
      id: params.id,
      ownerId: workspace.owner.id,
    },
    include: {
      uploads: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return <div className="card">Client not found.</div>;
  }

  const totalAudits = client.uploads.length;

  const totalSavings = client.uploads.reduce((sum, upload) => {
    const data = upload.parsedData as any;
    return sum + (Number(data?.estimated_savings) || 0);
  }, 0);

  const leakageScores = client.uploads
    .map((upload) => Number((upload.parsedData as any)?.leakage_score))
    .filter((score) => !Number.isNaN(score));

  const averageLeakage =
    leakageScores.length > 0
      ? Math.round(
          leakageScores.reduce((sum, score) => sum + score, 0) /
            leakageScores.length
        )
      : 0;

  const highestRisk =
    leakageScores.length > 0 ? Math.max(...leakageScores) : 0;

  return (
    <>
      <Link href="/dashboard/clients" style={{ color: "#60a5fa" }}>
        ← Back to Clients
      </Link>

      <h1 style={{ fontSize: "42px", marginTop: "24px" }}>
        {client.name}
      </h1>

      {client.notes && (
        <p className="gray" style={{ marginTop: "10px" }}>
          {client.notes}
        </p>
      )}

      <div className="report-grid" style={{ marginTop: "34px" }}>
        <div className="card">
          <div className="card-title">Client Audits</div>
          <div className="metric-value">{totalAudits}</div>
        </div>

        <div className="card">
          <div className="card-title">Potential Savings</div>
          <div className="metric-value green">
            €{totalSavings.toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Average Leakage</div>
          <div className="metric-value">{averageLeakage}/100</div>
        </div>

        <div className="card">
          <div className="card-title">Highest Risk</div>
          <div className="metric-value">{highestRisk}/100</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="card-title">Client Audit History</div>

          <Link href={`/dashboard/reports?clientId=${client.id}`}>
            <button className="primary-button" style={{ padding: "10px 16px" }}>
              View In Reports
            </button>
          </Link>
        </div>

        {client.uploads.length === 0 ? (
          <p className="gray" style={{ marginTop: "12px" }}>
            No audits attached to this client yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
            {client.uploads.slice(0, 10).map((upload) => {
              const data = upload.parsedData as any;

              return (
                <Link key={upload.id} href={`/dashboard/reports/${upload.id}`}>
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{upload.fileUrl}</div>

                    <div className="gray" style={{ marginTop: "8px" }}>
                      Leakage Score: {data?.leakage_score ?? "N/A"}/100
                    </div>

                    <div className="gray" style={{ marginTop: "8px" }}>
                      Estimated Savings: €{data?.estimated_savings?.toLocaleString?.() || "N/A"}
                    </div>

                    <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                      {new Date(upload.createdAt).toLocaleString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
