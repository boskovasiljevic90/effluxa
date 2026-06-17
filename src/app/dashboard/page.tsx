import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import BusinessUpgradeButton from "./BusinessUpgradeButton";
import { getWorkspaceOwner } from "@/lib/workspace";

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: {
    business?: string;
    session_id?: string;
  };
}) {
  const user = await getUser();

  if (!user) redirect("/login");

  if (
    searchParams?.business === "success" &&
    searchParams?.session_id &&
    process.env.STRIPE_SECRET_KEY
  ) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const session = await stripe.checkout.sessions.retrieve(
        searchParams.session_id
      );

      const paid =
        session.payment_status === "paid" ||
        session.status === "complete";

      if (
        paid &&
        session.mode === "subscription" &&
        session.metadata?.product === "business_subscription" &&
        session.metadata?.userId === user.id
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "BUSINESS",
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : null,
            subscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : null,
            subscriptionStatus: "active",
            subscriptionEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
          },
        });

        redirect("/dashboard");
      }
    } catch (error) {
      console.error("BUSINESS SUCCESS VERIFY ERROR:", error);
    }
  }

  const workspace = await getWorkspaceOwner(user);

  const reports = await prisma.upload.findMany({
    where: { userId: workspace.owner.id },
    orderBy: { createdAt: "desc" },
  });

  const rawActivityEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const activityEvents = rawActivityEvents
    .filter((event) => {
      const metadata = event.metadata as any;

      return (
        event.userId === workspace.owner.id ||
        metadata?.workspaceOwnerId === workspace.owner.id
      );
    })
    .slice(0, 8);

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


  const latestAuditScore =
    reports.length > 0
      ? Number((reports[0].parsedData as any)?.leakage_score || 0)
      : 0;

  const bestSavingsOpportunity =
    reports.length > 0
      ? Math.max(
          0,
          ...reports.map((report) =>
            Number((report.parsedData as any)?.estimated_savings || 0)
          )
        )
      : 0;

  const highestRiskAudit =
    reports.length > 0
      ? Math.max(
          0,
          ...reports.map((report) =>
            Number((report.parsedData as any)?.leakage_score || 0)
          )
        )
      : 0;

  const previousAudits = reports.slice(1);

  const previousAverageLeakage =
    previousAudits.length > 0
      ? Math.round(
          previousAudits.reduce((sum, report) => {
            const data = report.parsedData as any;
            return sum + (Number(data?.leakage_score) || 0);
          }, 0) / previousAudits.length
        )
      : latestAuditScore;

  const improvementTrend =
    previousAverageLeakage > 0
      ? Math.round(
          ((previousAverageLeakage - latestAuditScore) /
            previousAverageLeakage) *
            100
        )
      : 0;

  const vendorTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();

  for (const report of reports) {
    const data = report.parsedData as any;

    for (const vendor of data?.top_vendors || []) {
      const name = vendor?.vendor || "Unknown vendor";
      const amount = Number(vendor?.amount || 0);
      vendorTotals.set(name, (vendorTotals.get(name) || 0) + amount);
    }

    for (const category of data?.high_cost_categories || []) {
      const name = category?.category || "Unknown category";
      const amount = Number(category?.amount || 0);
      categoryTotals.set(name, (categoryTotals.get(name) || 0) + amount);
    }
  }

  const topVendorsAcrossAudits = Array.from(vendorTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topCostCategoriesAcrossAudits = Array.from(categoryTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const onboardingSteps = [
    {
      label: "Upload first financial document",
      done: totalAudits > 0,
      href: "/dashboard/upload",
    },
    {
      label: "Create your first client",
      done: reports.some((report) => report.clientId),
      href: "/dashboard/clients",
    },
    {
      label: "Review your first AI audit",
      done: totalAudits > 0,
      href: "/dashboard/reports",
    },
    {
      label: "Export an executive report",
      done: workspace.hasBusinessAccess,
      href: "/dashboard/reports",
    },
  ];

  const onboardingCompleted = onboardingSteps.filter((step) => step.done).length;

  const auditActivityScore = totalAudits >= 10 ? 10 : totalAudits >= 5 ? 7 : totalAudits >= 2 ? 4 : 1;
  const savingsScore = totalEstimatedSavings > 0 ? 10 : 3;
  const leakagePenalty = Math.round(averageLeakageScore * 0.45);
  const riskPenalty = Math.round(highestRiskAudit * 0.25);
  const trendBonus = improvementTrend > 0 ? Math.min(10, Math.round(improvementTrend / 2)) : 0;
  const trendPenalty = improvementTrend < 0 ? Math.min(10, Math.abs(Math.round(improvementTrend / 2))) : 0;

  const workspaceHealthScore = Math.max(
    0,
    Math.min(
      100,
      75 + auditActivityScore + savingsScore + trendBonus - leakagePenalty - riskPenalty - trendPenalty
    )
  );

  const workspaceHealthStatus =
    workspaceHealthScore >= 80
      ? "Healthy"
      : workspaceHealthScore >= 60
        ? "Stable"
        : workspaceHealthScore >= 40
          ? "At Risk"
          : "Critical";

  const workspaceHealthColor =
    workspaceHealthScore >= 80
      ? "#4ade80"
      : workspaceHealthScore >= 60
        ? "#facc15"
        : workspaceHealthScore >= 40
          ? "#fb923c"
          : "#f87171";

  const actionCounts = new Map<string, number>();

  for (const report of reports) {
    const data = report.parsedData as any;
    const actions = [
      ...(data?.quick_wins || []),
      ...(data?.recommendations || []),
    ];

    for (const action of actions) {
      const text = String(action || "").trim();
      if (!text) continue;
      actionCounts.set(text, (actionCounts.get(text) || 0) + 1);
    }
  }

  const priorityActions = Array.from(actionCounts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);


  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">AI Financial Intelligence</div>
          <p className="gray" style={{ marginTop: "10px" }}>
            Detect financial leakage and optimize operational spending.
          </p>
        </div>

        <div className="plan-badge plan-free">{workspace.hasBusinessAccess ? "BUSINESS" : user.role}</div>
      </div>


      {workspace.hasBusinessAccess && (
        <div
          className="card"
          style={{
            marginBottom: "28px",
            border: "1px solid rgba(34,197,94,0.18)",
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(37,99,235,0.08))",
          }}
        >
          <div className="card-title">Workspace Health Score</div>

          <div
            style={{
              marginTop: "18px",
              display: "flex",
              justifyContent: "space-between",
              gap: "24px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "64px",
                  fontWeight: 950,
                  color: workspaceHealthColor,
                  lineHeight: 1,
                }}
              >
                {workspaceHealthScore}/100
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "22px",
                  fontWeight: 900,
                }}
              >
                {workspaceHealthStatus}
              </div>

              <p className="gray" style={{ marginTop: "12px", lineHeight: 1.7 }}>
                Based on average leakage, highest risk, identified savings,
                audit activity, and trend improvement across this workspace.
              </p>
            </div>

            <div
              style={{
                minWidth: "240px",
                padding: "18px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="gray">Trend</div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "30px",
                  fontWeight: 900,
                  color: improvementTrend >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                {improvementTrend > 0 ? "+" : ""}
                {improvementTrend}%
              </div>

              <div className="gray" style={{ marginTop: "12px" }}>
                Avg Leakage: {averageLeakageScore}/100
              </div>

              <div className="gray" style={{ marginTop: "8px" }}>
                Highest Risk: {highestRiskAudit}/100
              </div>
            </div>
          </div>
        </div>
      )}


      {workspace.hasBusinessAccess && (
        <div
          className="card"
          style={{
            marginBottom: "28px",
            border: "1px solid rgba(96,165,250,0.18)",
          }}
        >
          <div className="card-title">Priority Action Plan</div>

          <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
            The most repeated AI recommendations and quick wins across your workspace audits.
          </p>

          {priorityActions.length === 0 ? (
            <p className="gray" style={{ marginTop: "18px" }}>
              No priority actions yet. Upload more financial documents to generate repeated recommendations.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
              {priorityActions.map((action, index) => (
                <div
                  key={action.text}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {index + 1}. {action.text}
                  </div>

                  <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                    Seen across {action.count} audit{action.count === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

        <div className="card">
          <div className="card-title">Latest Audit Score</div>
          <div className="metric-value">{latestAuditScore}/100</div>
        </div>

        <div className="card">
          <div className="card-title">Improvement Trend</div>
          <div
            className="metric-value"
            style={{
              color: improvementTrend >= 0 ? "#4ade80" : "#f87171",
            }}
          >
            {improvementTrend > 0 ? "+" : ""}
            {improvementTrend}%
          </div>
        </div>

        <div className="card">
          <div className="card-title">Best Savings Opportunity</div>
          <div className="metric-value green">
            €{bestSavingsOpportunity.toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Highest Risk Audit</div>
          <div className="metric-value">{highestRiskAudit}/100</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "28px" }}>
        <div className="card-title">
          {workspace.hasBusinessAccess
            ? "Business Plan"
            : "Free Plan Usage"}
        </div>

        {workspace.hasBusinessAccess ? (
          <p className="gray" style={{ marginTop: "12px" }}>
            Unlimited AI audits enabled{workspace.isTeamMember ? " through your team workspace." : "."}
          </p>
        ) : (
          <p className="gray" style={{ marginTop: "12px" }}>
            You used {`${user.weeklyUploadCount}/3`} free AI audits.
          </p>
        )}
      </div>

      {!workspace.hasBusinessAccess && (
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
      )}

      <div className="card" style={{ marginBottom: "28px" }}>
        <div className="card-title">Getting Started</div>

        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Complete these steps to unlock the full value of Effluxa.
        </p>

        <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
          {onboardingSteps.map((step) => (
            <Link key={step.label} href={step.href}>
              <div
                style={{
                  padding: "15px",
                  borderRadius: "14px",
                  background: step.done
                    ? "rgba(34,197,94,0.10)"
                    : "rgba(255,255,255,0.04)",
                  border: step.done
                    ? "1px solid rgba(34,197,94,0.20)"
                    : "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  alignItems: "center",
                }}
              >
                <strong>{step.label}</strong>
                <span style={{ color: step.done ? "#4ade80" : "#cbd5e1", fontWeight: 900 }}>
                  {step.done ? "Done" : "Start"}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="gray" style={{ marginTop: "14px" }}>
          Progress: {onboardingCompleted}/{onboardingSteps.length}
        </p>
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

      {workspace.hasBusinessAccess && (
        <div className="card" style={{ marginBottom: "28px" }}>
          <div className="card-title">Executive Insights</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: "18px",
              marginTop: "18px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "14px" }}>
                Top Vendors Across Audits
              </div>

              {topVendorsAcrossAudits.length === 0 ? (
                <p className="gray">No vendor data yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {topVendorsAcrossAudits.map((vendor) => (
                    <div
                      key={vendor.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "14px",
                      }}
                    >
                      <span className="gray">{vendor.name}</span>
                      <strong>€{vendor.amount.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "14px" }}>
                Top Cost Categories
              </div>

              {topCostCategoriesAcrossAudits.length === 0 ? (
                <p className="gray">No category data yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {topCostCategoriesAcrossAudits.map((category) => (
                    <div
                      key={category.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "14px",
                      }}
                    >
                      <span className="gray">{category.name}</span>
                      <strong>€{category.amount.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {workspace.hasBusinessAccess && (
        <div className="card" style={{ marginBottom: "28px" }}>
          <div className="card-title">Workspace Activity</div>

          {activityEvents.length === 0 ? (
            <p className="gray" style={{ marginTop: "12px" }}>
              No workspace activity yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
              {activityEvents.map((event) => {
                const metadata = event.metadata as any;

                const actor =
                  metadata?.uploadedBy ||
                  metadata?.email ||
                  "Workspace user";

                const label =
                  event.type === "upload_created"
                    ? `${actor} uploaded ${metadata?.fileName || "a financial document"}`
                    : event.type === "business_subscription_activated"
                      ? "Business subscription activated"
                      : event.type === "business_subscription_cancelled"
                        ? "Business subscription cancelled"
                        : event.type === "business_subscription_payment_failed"
                          ? "Business subscription payment failed"
                          : event.type === "report_unlocked"
                            ? "Audit report unlocked"
                            : event.type === "checkout_created"
                              ? "Checkout started"
                              : event.type.replaceAll("_", " ");

                return (
                  <div
                    key={event.id}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>
                      {label}
                    </div>

                    <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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

                        {report.internalNote && (
                          <div className="gray" style={{ marginTop: "8px", color: "#4ade80" }}>
                            Internal note saved
                          </div>
                        )}
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
