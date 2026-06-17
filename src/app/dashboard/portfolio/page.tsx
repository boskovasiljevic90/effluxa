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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return await prisma.user.findUnique({ where: { id: decoded.userId } });
  } catch {
    return null;
  }
}

export default async function PortfolioPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);
  if (!workspace.hasBusinessAccess) redirect("/dashboard");

  const clients = await prisma.client.findMany({
    where: { ownerId: workspace.owner.id },
    include: {
      uploads: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const clientStats = clients.map((client) => {
    const audits = client.uploads.length;

    const totalSavings = client.uploads.reduce((sum, upload) => {
      const data = upload.parsedData as any;
      return sum + (Number(data?.estimated_savings) || 0);
    }, 0);

    const leakageScores = client.uploads
      .map((upload) => Number((upload.parsedData as any)?.leakage_score))
      .filter((score) => !Number.isNaN(score));

    const averageLeakage =
      leakageScores.length > 0
        ? Math.round(leakageScores.reduce((sum, score) => sum + score, 0) / leakageScores.length)
        : 0;

    const highestRisk = leakageScores.length > 0 ? Math.max(...leakageScores) : 0;

    const latestScore = leakageScores.length > 0 ? leakageScores[0] : 0;
    const previousScores = leakageScores.slice(1);

    const previousAverage =
      previousScores.length > 0
        ? Math.round(previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length)
        : latestScore;

    const trend =
      previousAverage > 0
        ? Math.round(((previousAverage - latestScore) / previousAverage) * 100)
        : 0;

    const healthScore = Math.max(
      0,
      Math.min(
        100,
        90 - Math.round(averageLeakage * 0.55) - Math.round(highestRisk * 0.25) + Math.max(0, Math.min(10, trend))
      )
    );

    const status =
      healthScore >= 80
        ? "Healthy"
        : healthScore >= 60
          ? "Stable"
          : healthScore >= 40
            ? "At Risk"
            : "Critical";

    return {
      id: client.id,
      name: client.name,
      notes: client.notes,
      audits,
      totalSavings,
      averageLeakage,
      highestRisk,
      trend,
      healthScore,
      status,
    };
  });

  const totalClients = clients.length;
  const totalAudits = clientStats.reduce((sum, client) => sum + client.audits, 0);
  const totalSavings = clientStats.reduce((sum, client) => sum + client.totalSavings, 0);

  const portfolioLeakage =
    clientStats.length > 0
      ? Math.round(clientStats.reduce((sum, client) => sum + client.averageLeakage, 0) / clientStats.length)
      : 0;

  const portfolioHealth =
    clientStats.length > 0
      ? Math.round(clientStats.reduce((sum, client) => sum + client.healthScore, 0) / clientStats.length)
      : 0;

  const highestRiskClients = [...clientStats]
    .sort((a, b) => b.highestRisk - a.highestRisk)
    .slice(0, 5);

  const largestSavingsClients = [...clientStats]
    .sort((a, b) => b.totalSavings - a.totalSavings)
    .slice(0, 5);

  const improvingClients = [...clientStats]
    .filter((client) => client.trend > 0)
    .sort((a, b) => b.trend - a.trend)
    .slice(0, 5);

  return (
    <>
      <h1 style={{ fontSize: "42px" }}>Portfolio Dashboard</h1>

      <p className="gray" style={{ marginTop: "10px" }}>
        CEO-level overview of client risk, savings opportunities, and financial leakage trends.
      </p>

      <div className="report-grid" style={{ marginTop: "34px" }}>
        <div className="card">
          <div className="card-title">Portfolio Health</div>
          <div className="metric-value">{portfolioHealth}/100</div>
        </div>

        <div className="card">
          <div className="card-title">Total Clients</div>
          <div className="metric-value">{totalClients}</div>
        </div>

        <div className="card">
          <div className="card-title">Total Audits</div>
          <div className="metric-value">{totalAudits}</div>
        </div>

        <div className="card">
          <div className="card-title">Portfolio Savings</div>
          <div className="metric-value green">€{totalSavings.toLocaleString()}</div>
        </div>

        <div className="card">
          <div className="card-title">Portfolio Leakage</div>
          <div className="metric-value">{portfolioLeakage}/100</div>
        </div>
      </div>

      <div className="report-grid" style={{ marginTop: "28px" }}>
        <div className="card">
          <div className="card-title">Highest Risk Clients</div>

          {highestRiskClients.length === 0 ? (
            <p className="gray" style={{ marginTop: "12px" }}>No client data yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
              {highestRiskClients.map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                  <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <strong>{client.name}</strong>
                    <div className="gray" style={{ marginTop: "8px" }}>
                      Highest Risk: {client.highestRisk}/100 · Avg Leakage: {client.averageLeakage}/100
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Largest Savings Opportunities</div>

          {largestSavingsClients.length === 0 ? (
            <p className="gray" style={{ marginTop: "12px" }}>No savings data yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
              {largestSavingsClients.map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                  <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <strong>{client.name}</strong>
                    <div className="gray" style={{ marginTop: "8px" }}>
                      Potential Savings: €{client.totalSavings.toLocaleString()} · Audits: {client.audits}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Fastest Improving Clients</div>

          {improvingClients.length === 0 ? (
            <p className="gray" style={{ marginTop: "12px" }}>No positive trend data yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
              {improvingClients.map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                  <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <strong>{client.name}</strong>
                    <div className="gray" style={{ marginTop: "8px" }}>
                      Improvement: +{client.trend}% · Health: {client.healthScore}/100
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div className="card-title">Client Ranking</div>

        {clientStats.length === 0 ? (
          <p className="gray" style={{ marginTop: "12px" }}>No clients yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
            {[...clientStats]
              .sort((a, b) => b.healthScore - a.healthScore)
              .map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div className="gray">Client</div>
                      <strong>{client.name}</strong>
                    </div>

                    <div>
                      <div className="gray">Health</div>
                      <strong>{client.healthScore}/100</strong>
                    </div>

                    <div>
                      <div className="gray">Status</div>
                      <strong>{client.status}</strong>
                    </div>

                    <div>
                      <div className="gray">Savings</div>
                      <strong>€{client.totalSavings.toLocaleString()}</strong>
                    </div>

                    <div>
                      <div className="gray">Audits</div>
                      <strong>{client.audits}</strong>
                    </div>

                    <div>
                      <div className="gray">Trend</div>
                      <strong>{client.trend > 0 ? "+" : ""}{client.trend}%</strong>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
