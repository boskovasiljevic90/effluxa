import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DISPLAY_PRICE, eur } from "@/lib/pricingDisplay";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import BusinessUpgradeButton from "./BusinessUpgradeButton";
import { getWorkspaceOwner } from "@/lib/workspace";
import { displayPlanLabel } from "@/lib/planDisplay";
import type { SubscriptionPlan } from "@/components/subscription/SubscriptionButton";

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

const subscriptionPlanIntents: SubscriptionPlan[] = [
  "pro_monthly",
  "pro_annual",
  "agency_monthly",
  "agency_annual",
];

const subscriptionPlanLabels: Record<SubscriptionPlan, string> = {
  pro_monthly: "Pro monthly",
  pro_annual: "Pro annual",
  agency_monthly: "Agency monthly",
  agency_annual: "Agency annual",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { plan?: string };
}) {
  const user = await getUser();

  if (!user) redirect("/login");

  const selectedPlan = subscriptionPlanIntents.includes(searchParams?.plan as SubscriptionPlan)
    ? searchParams?.plan as SubscriptionPlan
    : null;

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
  const unlockedAudits = reports.filter((report) => report.unlocked || user.role === "PRO" || workspace.hasBusinessAccess).length;

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


  

  const planLabel = workspace.hasBusinessAccess
    ? "Agency"
    : user.role === "BUSINESS"
      ? "Agency inactive"
      : user.role === "PRO"
        ? "Pro"
        : "Free";

  const unlimited = workspace.hasBusinessAccess || user.role === "PRO";
  const weeklyUsed = Math.min(3, user.weeklyUploadCount || 0);
  const recentReports = reports.slice(0, 6);

  function friendlyFileName(report: (typeof reports)[number]) {
    const data = report.parsedData as any;
    const raw = typeof data?.source_file === "string" ? data.source_file : "";
    const base = raw.split(/[\\/]/).pop()?.trim() || "";
    if (base && !/^(instant|seed):/i.test(base) && base.length <= 64) return base;
    return "Financial audit";
  }

  function formatDate(value: Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <p className="dash-eyebrow">Workspace overview</p>
          <h1 className="dash-title">Welcome back</h1>
          <p className="dash-sub">
            Run a leakage review, see what changed since the last period, and keep every file in one place.
          </p>
        </div>
        <div className="dash-head-actions">
          <span className="dash-plan">{planLabel}</span>
          <Link href="/dashboard/upload" className="dash-btn dash-btn-primary">
            New audit
          </Link>
        </div>
      </div>

      {user.referredByCode && totalAudits === 0 && (
        <div className="dash-banner">
          <div>
            <div style={{ fontWeight: 900 }}>Partner-guided first audit</div>
            <p style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px", lineHeight: 1.55 }}>
              Start with one invoice batch, bank statement or export. Redact account numbers before uploading.
            </p>
          </div>
          <Link href="/dashboard/upload" className="dash-btn dash-btn-ghost">
            Upload first file
          </Link>
        </div>
      )}

      <div className="dash-metrics">
        <div className="dash-metric">
          <div className="dash-metric-label">Audits</div>
          <div className="dash-metric-value">{totalAudits}</div>
          <div className="dash-metric-hint">{unlockedAudits} unlocked</div>
        </div>
        <div className="dash-metric">
          <div className="dash-metric-label">Average score</div>
          <div className="dash-metric-value">
            {reports.length > 0 ? `${averageLeakageScore}/100` : "—"}
          </div>
          <div className="dash-metric-hint">
            {reports.length > 0 ? "Across all files" : "No audits yet"}
          </div>
        </div>
        <div className="dash-metric">
          <div className="dash-metric-label">Savings identified</div>
          <div className="dash-metric-value">
            {totalEstimatedSavings > 0 ? eur(Math.round(totalEstimatedSavings)) : "—"}
          </div>
          <div className="dash-metric-hint">Review estimates, not recovered cash</div>
        </div>
        <div className="dash-metric">
          <div className="dash-metric-label">Plan usage</div>
          <div className="dash-metric-value">{unlimited ? "Unlimited" : `${weeklyUsed}/3`}</div>
          <div className="dash-metric-hint">
            {unlimited ? planLabel : "Free audits this week"}
          </div>
        </div>
      </div>

      <div className="dash-layout">
        <div className="dash-main">
          <section className="dash-card">
            <div className="dash-card-head">
              <h2 className="dash-card-title">Recent audits</h2>
              <Link href="/dashboard/reports" className="dash-link">
                View all
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="dash-empty">
                No audits yet. Start with one financial file and Effluxa will rank what to review first.
                <div style={{ marginTop: "16px" }}>
                  <Link href="/dashboard/upload" className="dash-btn dash-btn-primary">
                    Start a free audit
                  </Link>
                </div>
              </div>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => {
                    const data = report.parsedData as any;
                    const score = Number(data?.leakage_score);
                    const unlocked =
                      report.unlocked || user.role === "PRO" || workspace.hasBusinessAccess;
                    return (
                      <tr key={report.id}>
                        <td>
                          <Link href={`/dashboard/reports/${report.id}`} style={{ textDecoration: "none" }}>
                            <div className="dash-file">{friendlyFileName(report)}</div>
                            <div className="dash-meta">{report.clientId ? "Client file" : "Own file"}</div>
                          </Link>
                        </td>
                        <td>{formatDate(report.createdAt)}</td>
                        <td>
                          <span className="dash-score">
                            {Number.isFinite(score) && score > 0 ? `${Math.round(score)}/100` : "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`dash-badge ${unlocked ? "dash-badge-ok" : "dash-badge-wait"}`}>
                            {unlocked ? "Unlocked" : "Preview"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {priorityActions.length > 0 && (
            <section className="dash-card">
              <div className="dash-card-head">
                <h2 className="dash-card-title">Review next</h2>
                <span className="dash-meta">Actions repeated across your audits</span>
              </div>
              <div>
                {priorityActions.slice(0, 5).map((action) => (
                  <div key={action.text} className="dash-action">
                    <span>{action.text}</span>
                    <span className="dash-count">{action.count}x</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {workspace.hasBusinessAccess && (
            <section className="dash-card">
              <div className="dash-card-head">
                <h2 className="dash-card-title">Workspace health</h2>
                <span className="dash-meta">{workspaceHealthStatus}</span>
              </div>
              <div className="dash-health">
                <div className="dash-health-value" style={{ color: workspaceHealthColor }}>
                  {workspaceHealthScore}
                </div>
                <div className="dash-health-bar">
                  <div className="dash-meta" style={{ marginTop: 0 }}>
                    Based on audit activity, savings found and open risk
                  </div>
                  <div className="dash-progress">
                    <span style={{ width: `${workspaceHealthScore}%` }} />
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="dash-side">
          {!unlimited && (
            <section className="dash-card">
              <div className="dash-card-head">
                <h2 className="dash-card-title">Plan</h2>
              </div>
              <div className="dash-upgrade-price">
                {eur(DISPLAY_PRICE.proMonthly)}
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}> /month</span>
              </div>
              <p className="dash-upgrade-note">
                Unlimited audits, full reports, period comparison and exports.
              </p>
              <div style={{ marginTop: "16px" }}>
                <BusinessUpgradeButton
                  currentRole={user.role}
                  hasBusinessAccess={workspace.hasBusinessAccess}
                  preferredPlan={selectedPlan}
                  variant="compact"
                />
              </div>
            </section>
          )}

          <section className="dash-card">
            <div className="dash-card-head">
              <h2 className="dash-card-title">Getting started</h2>
              <span className="dash-meta">
                {onboardingCompleted}/{onboardingSteps.length}
              </span>
            </div>
            <div>
              {onboardingSteps.map((step) => (
                <div
                  key={step.label}
                  className={`dash-step ${step.done ? "dash-step-done" : ""}`}
                >
                  <div className="dash-step-dot">{step.done ? "\u2713" : ""}</div>
                  <Link href={step.href}>{step.label}</Link>
                </div>
              ))}
            </div>
            <div className="dash-progress">
              <span
                style={{
                  width: `${Math.round((onboardingCompleted / onboardingSteps.length) * 100)}%`,
                }}
              />
            </div>
            <div className="dash-progress-text">
              {Math.round((onboardingCompleted / onboardingSteps.length) * 100)}% complete
            </div>
          </section>

          <section className="dash-card">
            <div className="dash-card-head">
              <h2 className="dash-card-title">New audit</h2>
            </div>
            <p className="dash-upgrade-note" style={{ marginTop: 0 }}>
              Upload an invoice batch, statement, CSV or Excel export. Every finding carries source evidence.
            </p>
            <div style={{ marginTop: "14px" }}>
              <Link
                href="/dashboard/upload"
                className="dash-btn dash-btn-primary"
                style={{ width: "100%" }}
              >
                Upload financial file
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
