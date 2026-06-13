import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import BusinessUpgradeButton from "./BusinessUpgradeButton";

export const dynamic = "force-dynamic";

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

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const reports = await prisma.upload.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const totalAudits = reports.length;
  const unlockedAudits = reports.filter((report) => report.unlocked).length;

  const totalEstimatedSavings = reports.reduce((sum, report) => {
    const data = report.parsedData as any;
    return sum + (Number(data?.estimated_savings) || 0);
  }, 0);

  const leakageScores = reports
    .map((report) => {
      const data = report.parsedData as any;
      return Number(data?.leakage_score);
    })
    .filter((score) => !Number.isNaN(score));

  const averageLeakageScore =
    leakageScores.length > 0
      ? Math.round(
          leakageScores.reduce((sum, score) => sum + score, 0) /
            leakageScores.length
        )
      : 0;


  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">AI Financial Intelligence</div>
          <p className="gray" style={{ marginTop: "10px" }}>
            Detect financial leakage and optimize operational spending.
          </p>
        </div>

        <div className="plan-badge plan-free">{user.role}</div>
      </div>


      <div className="report-grid" style={{ marginBottom: "28px" }}>
        <div className="card">
          <div className="card-title">Total Audits</div>
          <div className="metric-value">{totalAudits}</div>
        </div>

        <div className="card">
          <div className="card-title">Potential Savings Found</div>
          <div className="metric-value green">
            €{totalEstimatedSavings.toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Average Leakage Score</div>
          <div className="metric-value">{averageLeakageScore}/100</div>
        </div>

        <div className="card">
          <div className="card-title">Unlocked Reports</div>
          <div className="metric-value green">{unlockedAudits}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "28px" }}>
        <div className="card-title">
          {user.role === "BUSINESS"
            ? "Business Plan"
            : "Free Plan Usage"}
        </div>

        {user.role === "BUSINESS" ? (
          <p className="gray" style={{ marginTop: "12px" }}>
            Unlimited AI audits enabled.
          </p>
        ) : (
          <p className="gray" style={{ marginTop: "12px" }}>
            You used {user.weeklyUploadCount}/3 free AI audits.
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: "28px" }}>
        <div className="card-title">Business Plan</div>

        <p className="gray" style={{ marginTop: "12px" }}>
          Unlimited AI audits, unlimited reports,
          5 team seats and priority processing.
        </p>

        <div
          style={{
            marginTop: "20px",
            fontSize: "28px",
            fontWeight: 900,
          }}
        >
          €44.99/month
        </div>

        <BusinessUpgradeButton />
      </div>

      <div className="card" style={{ marginBottom: "28px" }}>
        <div className="card-title">Start New AI Audit</div>
        <p className="gray">
          Upload invoices, statements, CSV exports, Excel reports, or accounting documents.
        </p>

        <Link href="/dashboard/upload">
          <button className="primary-button" style={{ marginTop: "24px" }}>
            Upload Financial Document
          </button>
        </Link>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div className="card-title">Recent AI Audits</div>

          <Link href="/dashboard/reports">
            <button className="primary-button" style={{ padding: "10px 16px", fontSize: "14px" }}>
              View All Reports
            </button>
          </Link>
        </div>

        {reports.length === 0 ? (
          <p className="gray">No audits yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reports.slice(0, 6).map((report) => {
              const data = report.parsedData as any;

              return (
                <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                  <div
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                          {report.fileUrl}
                        </div>
                        <div className="gray" style={{ marginTop: "8px" }}>
                          Leakage Score: {data?.leakage_score ?? "N/A"}/100
                        </div>
                        <div className="gray" style={{ marginTop: "8px" }}>
                          {new Date(report.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "8px 14px",
                          borderRadius: "999px",
                          height: "fit-content",
                          background: report.unlocked
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(255,255,255,0.08)",
                          color: report.unlocked ? "#4ade80" : "#cbd5e1",
                          fontWeight: "bold",
                        }}
                      >
                        {report.unlocked ? "UNLOCKED" : "PREVIEW"}
                      </div>
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
