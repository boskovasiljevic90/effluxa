export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOperationalAdminFromToken } from "@/lib/adminAuth";
import AdminResetUsageButton from "./AdminResetUsageButton";
import DeleteContactMessageButton from "./DeleteContactMessageButton";
import DeleteEventButton from "./DeleteEventButton";
import PartnerAccessForm from "./PartnerAccessForm";
import ContactMessageStatus from "./ContactMessageStatus";
import { hasActiveAgencyAccess } from "@/lib/complimentaryAccess";
import { getReferralLink } from "@/lib/referrals";
import { buildAcquisitionFunnel, buildGrowthCohorts } from "@/lib/growthMetrics";
import { buildPilotLeadFunnel } from "@/lib/pilotLeadMetrics";
import { verifiedRecoveredAmount } from "@/lib/controlVerification";
import { buildRevenueSummary } from "@/lib/revenueMetrics";

function pilotProfileSummary(profile: unknown) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return "";

  const values = profile as Record<string, unknown>;
  const roleLabels: Record<string, string> = {
    accounting_bookkeeping: "Accounting/bookkeeping",
    fractional_cfo: "Fractional CFO",
    in_house_finance: "In-house finance",
    other: "Other finance role",
  };
  const portfolioLabels: Record<string, string> = {
    "1_5": "1–5 clients",
    "6_20": "6–20 clients",
    "21_50": "21–50 clients",
    "50_plus": "50+ clients",
  };
  const focusLabels: Record<string, string> = {
    duplicate_payments: "Duplicate payments",
    recurring_spend: "Recurring spend/price creep",
    cash_flow: "Cash flow/working capital",
    not_sure: "Focus not decided",
  };

  return [
    typeof values.role === "string" ? roleLabels[values.role] : null,
    typeof values.portfolioSize === "string" ? portfolioLabels[values.portfolioSize] : null,
    typeof values.focus === "string" ? focusLabels[values.focus] : null,
    values.canProvideRedactedFile === true ? "Redacted file available" : "No file committed yet",
  ].filter(Boolean).join(" · ");
}

export default async function AdminDashboardPage() {
  const adminUser = await getOperationalAdminFromToken(cookies().get("token")?.value);

  if (!adminUser) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      email: true,
      role: true,
      weeklyUploadCount: true,
      referralCode: true,
      createdAt: true,
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const usersCount = await prisma.user.count();

  const businessUsersCount = await prisma.user.count({
    where: { role: "BUSINESS" },
  });

  const now = new Date();

  const growthAccounts = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
      role: true,
      referredByCode: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
      paddleSubscriptionId: true,
      billingPlan: true,
      complimentaryAgencyAccessUntil: true,
      complimentaryAgencyAccessRevokedAt: true,
    },
  });

  const growthAudits = await prisma.upload.findMany({
    select: {
      userId: true,
      createdAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const growthAccountSnapshots = growthAccounts.map((account) => ({
    id: account.id,
    createdAt: account.createdAt,
    isPartner: Boolean(account.referredByCode),
    isPaid:
        (account.role !== "FREE" &&
          ["active", "trialing"].includes(account.subscriptionStatus) &&
          (!account.subscriptionEndDate || account.subscriptionEndDate > now)) ||
        (account.role === "BUSINESS" &&
          !account.complimentaryAgencyAccessRevokedAt &&
          Boolean(account.complimentaryAgencyAccessUntil && account.complimentaryAgencyAccessUntil > now)),
  }));

  const revenueSummary = buildRevenueSummary(growthAccounts, now);

  const growthCohorts = buildGrowthCohorts(growthAccountSnapshots, growthAudits);

  const pilotLeads = await prisma.contactMessage.findMany({
    where: { source: "partner_pilot" },
    select: {
      email: true,
      createdAt: true,
    },
  });

  const pilotLeadFunnel = buildPilotLeadFunnel(
    pilotLeads,
    growthAccounts.map((account) => ({
      email: account.email,
      createdAt: account.createdAt,
      isPaid: Boolean(
        account.paddleSubscriptionId &&
        ["active", "trialing"].includes(account.subscriptionStatus) &&
        (!account.subscriptionEndDate || account.subscriptionEndDate > now)
      ),
    })),
    growthAudits.map((audit) => ({
      email: audit.user.email,
      createdAt: audit.createdAt,
    }))
  );

  const activeBusinessUsersCount = await prisma.user.count({
    where: {
      role: "BUSINESS",
      OR: [
        {
          subscriptionStatus: { in: ["active", "trialing"] },
          OR: [
            { subscriptionEndDate: null },
            { subscriptionEndDate: { gt: now } },
          ],
        },
        {
          complimentaryAgencyAccessRevokedAt: null,
          complimentaryAgencyAccessUntil: { gt: now },
        },
      ],
    },
  });

  const newUsersLast30Days = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const reportsCount = await prisma.upload.count();

  const reportsLast30Days = await prisma.upload.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const unlockedReportsCount = await prisma.upload.count({
    where: { unlocked: true },
  });

  const allReports = await prisma.upload.findMany({
    select: {
      parsedData: true,
    },
  });

  const totalSavingsFound = allReports.reduce((sum, report) => {
    const data = report.parsedData as any;
    return sum + (Number(data?.estimated_savings) || 0);
  }, 0);

  const events = await prisma.event.findMany({
    where: {
      NOT: { type: { startsWith: "stripe_" } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const errorEvents = await prisma.event.findMany({
    where: {
      type: {
        contains: "error",
      },
      NOT: { type: { startsWith: "stripe_" } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const contactMessages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const openPartnerPilotLeads = await prisma.contactMessage.count({
    where: {
      source: "partner_pilot",
      status: { not: "CLOSED" },
    },
  });

  const totalPartnerPilotLeads = await prisma.contactMessage.count({
    where: { source: "partner_pilot" },
  });

  const duePartnerPilotLeads = await prisma.contactMessage.count({
    where: {
      source: "partner_pilot",
      status: { not: "CLOSED" },
      nextActionAt: { lte: now },
    },
  });

  const checkoutCount = await prisma.event.count({
    where: { type: "checkout_created" },
  });

  const revenueEvents = await prisma.event.count({
    where: { type: "full_audit_unlocked" },
  });

  const signupEventsCount = await prisma.event.count({
    where: { type: "signup" },
  });

  const signupAttributionEvents = await prisma.event.findMany({
    where: {
      type: "signup",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { userId: true, createdAt: true, metadata: true },
  });

  const acquisitionSignups = signupAttributionEvents.flatMap((event) => {
    if (!event.userId) return [];

    const metadata = event.metadata && typeof event.metadata === "object"
      ? event.metadata as Record<string, any>
      : {};
    const source = typeof metadata.acquisitionSource === "string"
      ? metadata.acquisitionSource
      : metadata.acquisitionChannel === "partner_referral"
        ? "partner_referral"
        : "direct";
    const content = typeof metadata.acquisitionContent === "string"
      ? ` / ${metadata.acquisitionContent}`
      : "";

    return [{ userId: event.userId, source: `${source}${content}`, createdAt: event.createdAt }];
  });

  const signupAttributionRows = buildAcquisitionFunnel(
    acquisitionSignups,
    growthAccountSnapshots,
    growthAudits
  );

  const uploadEventsCount = await prisma.event.count({
    where: { type: "upload_created" },
  });

  const uploadAnalysisEvents = await prisma.event.findMany({
    where: {
      type: "upload_created",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { metadata: true },
  });

  const analysisTelemetry = uploadAnalysisEvents
    .map((event) => (event.metadata && typeof event.metadata === "object" ? event.metadata as any : null))
    .filter((metadata): metadata is Record<string, any> => Boolean(metadata?.analysisDurationMs));
  const v3Telemetry = analysisTelemetry.filter((metadata) => metadata.auditEngine === "v3");
  const fastPathTelemetry = v3Telemetry.filter((metadata) => metadata.analysisPath === "fast_text");
  const fallbackTelemetry = analysisTelemetry.filter((metadata) => metadata.fallbackUsed === true);
  const telemetryDurations = v3Telemetry
    .map((metadata) => Number(metadata.analysisDurationMs))
    .filter((duration) => Number.isFinite(duration) && duration >= 0)
    .sort((a, b) => a - b);

  function percentile(values: number[], percentileValue: number) {
    if (values.length === 0) return 0;
    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.ceil((percentileValue / 100) * values.length) - 1)
    );
    return values[index];
  }

  const v3MedianMs = percentile(telemetryDurations, 50);
  const v3P95Ms = percentile(telemetryDurations, 95);
  const v3Share = analysisTelemetry.length > 0
    ? Math.round((v3Telemetry.length / analysisTelemetry.length) * 100)
    : 0;
  const fastPathShare = v3Telemetry.length > 0
    ? Math.round((fastPathTelemetry.length / v3Telemetry.length) * 100)
    : 0;

  const findingReviewGroups = await prisma.findingReview.groupBy({
    by: ["verdict"],
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { _all: true },
  });

  const findingReviewCounts = {
    TRUE: 0,
    FALSE: 0,
    UNCLEAR: 0,
  };

  for (const group of findingReviewGroups) {
    if (group.verdict in findingReviewCounts) {
      findingReviewCounts[group.verdict as keyof typeof findingReviewCounts] = group._count._all;
    }
  }

  const findingReviewTotal = Object.values(findingReviewCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const reviewedFindingRows = await prisma.findingReview.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      reportId: true,
      findingId: true,
    },
    distinct: ["reportId", "findingId"],
  });
  const supportedReviewRate = findingReviewTotal > 0
    ? Math.round((findingReviewCounts.TRUE / findingReviewTotal) * 100)
    : 0;

  const auditJobGroups = await prisma.auditJob.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const auditJobCounts = {
    QUEUED: 0,
    PROCESSING: 0,
    RETRYABLE: 0,
    COMPLETE: 0,
    FAILED: 0,
  };
  for (const group of auditJobGroups) {
    if (group.status in auditJobCounts) {
      auditJobCounts[group.status as keyof typeof auditJobCounts] = group._count._all;
    }
  }
  const completedAuditJobsLast30Days = await prisma.auditJob.count({
    where: {
      status: "COMPLETE",
      completedAt: { gte: thirtyDaysAgo },
    },
  });
  const failedAuditJobsLast30Days = await prisma.auditJob.count({
    where: {
      status: { in: ["FAILED", "RETRYABLE"] },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  const signupUserIds = await prisma.event.findMany({
    where: { type: "signup", userId: { not: null } },
    select: { userId: true },
    distinct: ["userId"],
  });

  const uploadUserIds = await prisma.event.findMany({
    where: { type: "upload_created", userId: { not: null } },
    select: { userId: true },
    distinct: ["userId"],
  });

  const unlockedUserIds = await prisma.event.findMany({
    where: { type: "full_audit_unlocked", userId: { not: null } },
    select: { userId: true },
    distinct: ["userId"],
  });

  const partnerSignupsCount = await prisma.user.count({
    where: { referredByCode: { not: null } },
  });

  const partnerAuditsCount = await prisma.upload.count({
    where: { user: { referredByCode: { not: null } } },
  });

  const referralPartners = await prisma.user.findMany({
    where: { referralCode: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      referralCode: true,
      role: true,
      paddleSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
      complimentaryAgencyAccessUntil: true,
      complimentaryAgencyAccessRevokedAt: true,
    },
  });

  const referredUsers = await prisma.user.findMany({
    where: { referredByCode: { not: null } },
    select: {
      id: true,
      referredByCode: true,
      role: true,
      paddleSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
      complimentaryAgencyAccessUntil: true,
      complimentaryAgencyAccessRevokedAt: true,
      uploads: {
        select: {
          unlocked: true,
        },
      },
    },
  });

  const referredUserIds = referredUsers.map((user) => user.id);
  const partnerControlActions = referredUserIds.length > 0
    ? await prisma.controlAction.findMany({
        where: { workspaceOwnerId: { in: referredUserIds } },
        select: {
          workspaceOwnerId: true,
          status: true,
          outcomeNote: true,
          resolvedAmount: true,
        },
      })
    : [];

  const partnerFunnel = referralPartners
    .map((partner) => {
      const referralCode = partner.referralCode || "";
      const referred = referredUsers.filter(
        (user) => user.referredByCode === referralCode
      );
      const referredWithAudit = referred.filter((user) => user.uploads.length > 0);
      const referredWithUnlockedAudit = referred.filter((user) =>
        user.uploads.some((upload) => upload.unlocked)
      );
      const activeAgencyUsers = referred.filter((user) =>
        hasActiveAgencyAccess(user, now)
      );
      const controls = partnerControlActions.filter((action) =>
        referred.some((user) => user.id === action.workspaceOwnerId)
      );
      const actionedControls = controls.filter(
        (action) => action.status === "ACTIONED"
      ).length;
      const verifiedRecovered = controls.reduce(
        (sum, action) => sum + verifiedRecoveredAmount(action),
        0
      );

      return {
        id: partner.id,
        email: partner.email,
        referralCode,
        referralUrl: getReferralLink(referralCode),
        referralSignups: referred.length,
        firstAudits: referredWithAudit.length,
        unlockedAudits: referredWithUnlockedAudit.length,
        activeAgencyUsers: activeAgencyUsers.length,
        controlActions: controls.length,
        actionedControls,
        verifiedRecovered,
      };
    })
    .sort((a, b) =>
      b.activeAgencyUsers - a.activeAgencyUsers ||
      b.referralSignups - a.referralSignups
    );

  const partnerReferredWithAudit = partnerFunnel.reduce(
    (sum, partner) => sum + partner.firstAudits,
    0
  );
  const partnerUnlockedAudits = partnerFunnel.reduce(
    (sum, partner) => sum + partner.unlockedAudits,
    0
  );
  const partnerAgencyConversions = partnerFunnel.reduce(
    (sum, partner) => sum + partner.activeAgencyUsers,
    0
  );
  const partnerControlActionsCount = partnerFunnel.reduce(
    (sum, partner) => sum + partner.controlActions,
    0
  );
  const partnerVerifiedRecovered = partnerFunnel.reduce(
    (sum, partner) => sum + partner.verifiedRecovered,
    0
  );

  const partnerFirstAuditRate = partnerSignupsCount > 0
    ? Math.round((partnerReferredWithAudit / partnerSignupsCount) * 100)
    : 0;
  const partnerPaidUnlockRate = partnerSignupsCount > 0
    ? Math.round((partnerUnlockedAudits / partnerSignupsCount) * 100)
    : 0;
  const partnerAgencyRate = partnerSignupsCount > 0
    ? Math.round((partnerAgencyConversions / partnerSignupsCount) * 100)
    : 0;

  const businessActivatedEventsCount = await prisma.event.count({
    where: { type: "business_subscription_activated" },
  });

  const teamInviteEventsCount = await prisma.event.count({
    where: { type: "team_invite_sent" },
  });

  const monthlySummaryEventsCount = await prisma.event.count({
    where: { type: "monthly_executive_summary_sent" },
  });

  const reportShareEventsCount = await prisma.event.count({
    where: { type: "report_share_created" },
  });

  const reportExportEventsCount = await prisma.event.count({
    where: {
      type: {
        in: ["report_pdf_exported", "workspace_pdf_exported", "workspace_csv_exported"],
      },
    },
  });

  const eventGroups = await prisma.event.groupBy({
    by: ["type"],
    where: {
      NOT: { type: { startsWith: "stripe_" } },
    },
    _count: { type: true },
    orderBy: { _count: { type: "desc" } },
    take: 10,
  });

  const signupToUploadRate =
    signupUserIds.length > 0
      ? Math.round((uploadUserIds.length / signupUserIds.length) * 100)
      : 0;

  const uploadToUnlockRate =
    uploadUserIds.length > 0
      ? Math.round((unlockedUserIds.length / uploadUserIds.length) * 100)
      : 0;

  const businessConversionRate =
    usersCount > 0
      ? Math.round((activeBusinessUsersCount / usersCount) * 100)
      : 0;

  const conversionRate =
    reportsCount > 0
      ? Math.round((unlockedReportsCount / reportsCount) * 100)
      : 0;

  const launchChecklist = [
    { label: "Production domain configured", done: Boolean(process.env.NEXT_PUBLIC_APP_URL) },
    { label: "Database connected", done: Boolean(process.env.DATABASE_URL) },
    { label: "JWT secret configured", done: Boolean(process.env.JWT_SECRET) },
    { label: "OpenAI API configured", done: Boolean(process.env.OPENAI_API_KEY) },
    { label: "Paddle configured", done: Boolean(process.env.PADDLE_API_KEY) },
    { label: "Paddle webhook configured", done: Boolean(process.env.PADDLE_WEBHOOK_SECRET) },
    { label: "Resend email configured", done: Boolean(process.env.RESEND_API_KEY) },
    { label: "Cron secret configured", done: Boolean(process.env.CRON_SECRET) },
    { label: "At least one user created", done: usersCount > 0 },
    { label: "At least one audit generated", done: reportsCount > 0 },
    { label: "Sitemap and robots enabled", done: true },
    { label: "Monthly executive cron enabled", done: true },
  ];

  const launchReadyCount = launchChecklist.filter((item) => item.done).length;
  const launchReadyPercent = Math.round((launchReadyCount / launchChecklist.length) * 100);
  const formatRate = (value: number | null) => value === null ? "—" : `${value}%`;
  const formatEuroCents = (value: number) =>
    `€${(value / 100).toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;

  return (
    <div className="page-container">
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <Link href="/dashboard" style={{ color: "#60a5fa" }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ fontSize: "42px", marginTop: "30px" }}>
          Effluxa Admin Analytics
        </h1>

        <p className="gray" style={{ marginTop: "10px" }}>
          Internal business dashboard for tracking signups, audits, payments, and conversion.
        </p>

        <div className="report-grid" style={{ marginTop: "40px" }}>
          <div className="card">
            <div className="card-title">Users</div>
            <div className="metric-value">{usersCount}</div>
          </div>

          <div className="card">
            <div className="card-title">Business Users</div>
            <div className="metric-value green">{businessUsersCount}</div>
          </div>

          <div className="card">
            <div className="card-title">Active Business</div>
            <div className="metric-value green">{activeBusinessUsersCount}</div>
          </div>

          <div className="card">
            <div className="card-title">New Users 30d</div>
            <div className="metric-value">{newUsersLast30Days}</div>
          </div>

          <div className="card">
            <div className="card-title">Total Audits</div>
            <div className="metric-value">{reportsCount}</div>
          </div>

          <div className="card">
            <div className="card-title">Audits 30d</div>
            <div className="metric-value">{reportsLast30Days}</div>
          </div>

          <div className="card">
            <div className="card-title">Unlocked Audits</div>
            <div className="metric-value green">{unlockedReportsCount}</div>
          </div>

          <div className="card">
            <div className="card-title">Checkout Started</div>
            <div className="metric-value">{checkoutCount}</div>
          </div>

          <div className="card">
            <div className="card-title">Conversion Rate</div>
            <div className="metric-value">{conversionRate}%</div>
          </div>

          <div className="card">
            <div className="card-title">Paid Unlock Events</div>
            <div className="metric-value green">{revenueEvents}</div>
            <p className="gray" style={{ marginTop: "8px", fontSize: "12px", lineHeight: 1.5 }}>
              Paddle unlock events; not a revenue estimate.
            </p>
          </div>

          <div className="card">
            <div className="card-title">Recurring Run-rate Proxy</div>
            <div className="metric-value green">{formatEuroCents(revenueSummary.estimatedMrrCents)}/mo</div>
            <p className="gray" style={{ marginTop: "8px", fontSize: "12px", lineHeight: 1.5 }}>
              {formatEuroCents(revenueSummary.estimatedArrCents)}/yr · {revenueSummary.activePaidAccounts} active Paddle subscription{revenueSummary.activePaidAccounts === 1 ? "" : "s"}
              {revenueSummary.unclassifiedActiveSubscriptions > 0
                ? ` · ${revenueSummary.unclassifiedActiveSubscriptions} without a known plan`
                : ""}
            </p>
            <p className="gray" style={{ marginTop: "6px", fontSize: "11px", lineHeight: 1.5 }}>
              Normalized from active plans; excludes taxes, fees, refunds and complimentary access.
            </p>
          </div>

          <div className="card">
            <div className="card-title">Total Savings Found</div>
            <div className="metric-value green">€{totalSavingsFound.toLocaleString()}</div>
          </div>
        </div>

      <div className="card" style={{ marginTop: "40px" }}>
          <div className="card-title">Funnel Analytics</div>

          <div className="report-grid" style={{ marginTop: "22px" }}>
            <div className="card">
              <div className="card-title">Signup Events</div>
              <div className="metric-value">{signupEventsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Upload Events</div>
              <div className="metric-value">{uploadEventsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Unique Signups</div>
              <div className="metric-value">{signupUserIds.length}</div>
            </div>

            <div className="card">
              <div className="card-title">Accounts with Upload</div>
              <div className="metric-value">{uploadUserIds.length}</div>
            </div>

            <div className="card">
              <div className="card-title">Partner Signups</div>
              <div className="metric-value green">{partnerSignupsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Partner Audits</div>
              <div className="metric-value green">{partnerAuditsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Business Activations</div>
              <div className="metric-value green">{businessActivatedEventsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Team Invites</div>
              <div className="metric-value">{teamInviteEventsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Monthly Emails Sent</div>
              <div className="metric-value">{monthlySummaryEventsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Report Shares</div>
              <div className="metric-value green">{reportShareEventsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Report Exports</div>
              <div className="metric-value">{reportExportEventsCount}</div>
            </div>

            <div className="card">
              <div className="card-title">Account Signup → Upload</div>
              <div className="metric-value">{signupToUploadRate}%</div>
            </div>

            <div className="card">
              <div className="card-title">Account Upload → Unlock</div>
              <div className="metric-value">{uploadToUnlockRate}%</div>
            </div>

            <div className="card">
              <div className="card-title">Business Conversion</div>
              <div className="metric-value green">{businessConversionRate}%</div>
            </div>
          </div>
        </div>

      <div className="card" style={{ marginTop: "40px" }}>
        <div className="card-title">Activation &amp; Cohort Metrics</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Activation means a completed audit within 7 days of signup. Return means a second completed audit within 28 days; the return rate only uses cohorts old enough to have reached day 28. These are account-level signals, not revenue or savings claims.
        </p>

        <div style={{ overflowX: "auto", marginTop: "22px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "780px" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8", fontSize: "12px" }}>
                <th style={{ padding: "10px 12px" }}>Cohort</th>
                <th style={{ padding: "10px 12px" }}>Signups</th>
                <th style={{ padding: "10px 12px" }}>Audit ≤7d</th>
                <th style={{ padding: "10px 12px" }}>Activation</th>
                <th style={{ padding: "10px 12px" }}>Matured</th>
                <th style={{ padding: "10px 12px" }}>Return ≤28d</th>
                <th style={{ padding: "10px 12px" }}>Paid</th>
                <th style={{ padding: "10px 12px" }}>Partner activation</th>
              </tr>
            </thead>
            <tbody>
              {growthCohorts.map((cohort) => (
                <tr key={cohort.label} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: "14px 12px", fontWeight: 800 }}>{cohort.label}</td>
                  <td style={{ padding: "14px 12px" }}>{cohort.signups}</td>
                  <td style={{ padding: "14px 12px" }}>{cohort.activatedWithin7Days}</td>
                  <td style={{ padding: "14px 12px", color: "#86efac", fontWeight: 800 }}>{formatRate(cohort.activationRate)}</td>
                  <td style={{ padding: "14px 12px" }}>{cohort.matureFor28DayRetention}</td>
                  <td style={{ padding: "14px 12px", color: "#86efac", fontWeight: 800 }}>{formatRate(cohort.retentionRate)}</td>
                  <td style={{ padding: "14px 12px" }}>{cohort.paidAccounts} ({formatRate(cohort.paidRate)})</td>
                  <td style={{ padding: "14px 12px" }}>{cohort.partnerSignups > 0 ? formatRate(cohort.partnerActivationRate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: "40px" }}>
        <div className="card-title">Signup Acquisition · Last 30 Days</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          First-touch source captured after analytics consent. Partner referrals remain separated from organic content so channel performance is not conflated.
        </p>

        {signupAttributionRows.length === 0 ? (
          <p className="gray" style={{ marginTop: "22px" }}>No attributed signup events yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px", marginTop: "22px" }}>
              {signupAttributionRows.map((row) => (
                <div
                  key={row.source}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "14px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <strong>{row.source}</strong>
                  <span className="gray">Signups: <strong className="white-text">{row.signups}</strong></span>
                  <span className="gray">Audit ≤7d: <strong className="white-text">{row.activatedWithin7Days} ({formatRate(row.activationRate)})</strong></span>
                  <span className="gray">Paid: <strong className="white-text">{row.paidAccounts} ({formatRate(row.paidRate)})</strong></span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "40px" }}>
        <div className="card-title">Engine Performance · Last 30 Days</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Production telemetry from completed uploads. New reports record engine path,
          duration, extraction volume and fallback status without storing source-file contents.
        </p>

        <div className="report-grid" style={{ marginTop: "22px" }}>
          <div className="card">
            <div className="card-title">Telemetry Audits</div>
            <div className="metric-value">{analysisTelemetry.length}</div>
          </div>
          <div className="card">
            <div className="card-title">V3 Share</div>
            <div className="metric-value green">{v3Share}%</div>
          </div>
          <div className="card">
            <div className="card-title">V3 Fast Path</div>
            <div className="metric-value">{fastPathShare}%</div>
          </div>
          <div className="card">
            <div className="card-title">V3 Median</div>
            <div className="metric-value">{v3MedianMs ? `${Math.round(v3MedianMs / 1000)}s` : "—"}</div>
          </div>
          <div className="card">
            <div className="card-title">V3 P95</div>
            <div className="metric-value">{v3P95Ms ? `${Math.round(v3P95Ms / 1000)}s` : "—"}</div>
          </div>
          <div className="card">
            <div className="card-title">Fallback Reports</div>
            <div className="metric-value">{fallbackTelemetry.length}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "40px" }}>
        <div className="card-title">Partner Pilot Conversion</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Same-email attribution proxy: partner-pilot contacts are deduplicated by email, signup must happen after the first lead, and activation means a first audit within 7 days of signup. This undercounts email changes and does not prove causation. Complimentary access is not counted as paid.
        </p>

        <div className="report-grid" style={{ marginTop: "22px" }}>
          <div className="card">
            <div className="card-title">Pilot Leads</div>
            <div className="metric-value">{pilotLeadFunnel.totalLeads}</div>
            <p className="gray" style={{ marginTop: "8px", fontSize: "12px" }}>
              {pilotLeadFunnel.leadsWithoutSignup} without same-email signup
            </p>
          </div>
          <div className="card">
            <div className="card-title">Same-email Signups</div>
            <div className="metric-value green">{pilotLeadFunnel.leadsWithSignup}</div>
            <p className="gray" style={{ marginTop: "8px", fontSize: "12px" }}>
              Lead → signup: {formatRate(pilotLeadFunnel.signupRate)}
            </p>
          </div>
          <div className="card">
            <div className="card-title">First Audit ≤7d</div>
            <div className="metric-value green">{pilotLeadFunnel.activatedWithin7Days}</div>
            <p className="gray" style={{ marginTop: "8px", fontSize: "12px" }}>
              Signup → activation: {formatRate(pilotLeadFunnel.activationRate)}
            </p>
          </div>
          <div className="card">
            <div className="card-title">Active Paid Accounts</div>
            <div className="metric-value green">{pilotLeadFunnel.paidAccounts}</div>
            <p className="gray" style={{ marginTop: "8px", fontSize: "12px" }}>
              Signup → paid: {formatRate(pilotLeadFunnel.paidRate)}
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "40px" }}>
        <div className="card-title">Audit Job Reliability</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Current durable job state plus completion and failure signals for the last 30 days.
        </p>
        <div className="report-grid" style={{ marginTop: "22px" }}>
          <div className="card">
            <div className="card-title">Queued</div>
            <div className="metric-value">{auditJobCounts.QUEUED}</div>
          </div>
          <div className="card">
            <div className="card-title">Processing</div>
            <div className="metric-value">{auditJobCounts.PROCESSING}</div>
          </div>
          <div className="card">
            <div className="card-title">Retryable</div>
            <div className="metric-value">{auditJobCounts.RETRYABLE}</div>
          </div>
          <div className="card">
            <div className="card-title">Failed</div>
            <div className="metric-value">{auditJobCounts.FAILED}</div>
          </div>
          <div className="card">
            <div className="card-title">Completed 30d</div>
            <div className="metric-value green">{completedAuditJobsLast30Days}</div>
          </div>
          <div className="card">
            <div className="card-title">Failed/Retryable 30d</div>
            <div className="metric-value">{failedAuditJobsLast30Days}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "40px" }}>
        <div className="card-title">Reviewer Feedback · Last 30 Days</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Human validation of evidence-backed findings. This is the signal used to improve rule precision; it is not a claim that every finding is a confirmed loss.
        </p>

        {findingReviewTotal === 0 ? (
          <p className="gray" style={{ marginTop: "22px" }}>
            No reviewer feedback has been recorded yet.
          </p>
        ) : (
          <div className="report-grid" style={{ marginTop: "22px" }}>
            <div className="card">
              <div className="card-title">Reviews</div>
              <div className="metric-value">{findingReviewTotal}</div>
            </div>
            <div className="card">
              <div className="card-title">Unique Findings</div>
              <div className="metric-value">{reviewedFindingRows.length}</div>
            </div>
            <div className="card">
              <div className="card-title">Supported</div>
              <div className="metric-value green">{findingReviewCounts.TRUE}</div>
            </div>
            <div className="card">
              <div className="card-title">Not Supported</div>
              <div className="metric-value">{findingReviewCounts.FALSE}</div>
            </div>
            <div className="card">
              <div className="card-title">Unclear</div>
              <div className="metric-value">{findingReviewCounts.UNCLEAR}</div>
            </div>
            <div className="card">
              <div className="card-title">Supported Share</div>
              <div className="metric-value green">{supportedReviewRate}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "40px" }}>
        <div className="card-title">Partner Growth Funnel</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Referral performance from signup through first audit, paid unlock, active Agency access, and verified financial recovery.
        </p>

        <div className="report-grid" style={{ marginTop: "22px" }}>
          <div className="card">
            <div className="card-title">Referral Signups</div>
            <div className="metric-value green">{partnerSignupsCount}</div>
          </div>
          <div className="card">
            <div className="card-title">First Audits</div>
            <div className="metric-value">{partnerReferredWithAudit}</div>
          </div>
          <div className="card">
            <div className="card-title">Paid Unlocks</div>
            <div className="metric-value">{partnerUnlockedAudits}</div>
          </div>
          <div className="card">
            <div className="card-title">Active Agency</div>
            <div className="metric-value green">{partnerAgencyConversions}</div>
          </div>
          <div className="card">
            <div className="card-title">Control Actions</div>
            <div className="metric-value">{partnerControlActionsCount}</div>
          </div>
          <div className="card">
            <div className="card-title">Verified Recovered</div>
            <div className="metric-value green">€{partnerVerifiedRecovered.toLocaleString()}</div>
          </div>
          <div className="card">
            <div className="card-title">Signup → First Audit</div>
            <div className="metric-value">{partnerFirstAuditRate}%</div>
          </div>
          <div className="card">
            <div className="card-title">Signup → Paid</div>
            <div className="metric-value">{partnerPaidUnlockRate}%</div>
          </div>
          <div className="card">
            <div className="card-title">Signup → Agency</div>
            <div className="metric-value green">{partnerAgencyRate}%</div>
          </div>
        </div>

        {partnerFunnel.length === 0 ? (
          <p className="gray" style={{ marginTop: "22px" }}>
            No referral partner has been provisioned yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginTop: "22px" }}>
            {partnerFunnel.map((partner) => (
              <div
                key={partner.id}
                style={{
                  padding: "18px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <strong>{partner.email}</strong>
                    <div className="gray" style={{ marginTop: "6px", fontSize: "12px" }}>
                      {partner.referralCode}
                    </div>
                    <a
                      href={partner.referralUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="gray"
                      style={{ display: "inline-block", marginTop: "8px", fontSize: "12px", wordBreak: "break-all" }}
                    >
                      {partner.referralUrl}
                    </a>
                  </div>
                  <div className="gray" style={{ fontSize: "13px" }}>
                    {partner.referralSignups > 0
                      ? `${partner.referralSignups} referred signup${partner.referralSignups === 1 ? "" : "s"}`
                      : "No referred signup yet"}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
                    gap: "12px",
                    marginTop: "16px",
                    fontSize: "13px",
                  }}
                >
                  <div><div className="gray">First audit</div><strong>{partner.firstAudits}</strong></div>
                  <div><div className="gray">Paid unlock</div><strong>{partner.unlockedAudits}</strong></div>
                  <div><div className="gray">Active Agency</div><strong>{partner.activeAgencyUsers}</strong></div>
                  <div><div className="gray">Controls</div><strong>{partner.controlActions}</strong></div>
                  <div><div className="gray">Actioned</div><strong>{partner.actionedControls}</strong></div>
                  <div><div className="gray">Verified recovered</div><strong>€{partner.verifiedRecovered.toLocaleString()}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PartnerAccessForm />

      <div className="card" style={{ marginTop: "40px" }}>
          <div className="card-title">Top Events</div>

          <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
            {eventGroups.map((event) => (
              <div
                key={event.type}
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <strong>{event.type}</strong>
                <span className="gray">{event._count.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: "40px" }}>
          <div className="card-title">Recent Errors</div>

          {errorEvents.length === 0 ? (
            <p className="gray">No errors tracked yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {errorEvents.map((event) => {
                const metadata = event.metadata as any;

                return (
                  <div
                    key={event.id}
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.18)",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#fca5a5" }}>
                      {event.type}
                    </div>

                    <div className="gray" style={{ marginTop: "8px" }}>
                      {metadata?.errorMessage || "Unknown error"}
                    </div>

                    <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                      {new Date(event.createdAt).toLocaleString()}
                    </div>

                    <DeleteEventButton eventId={event.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: "40px" }}>
          <div className="card-title">Recent Users</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold" }}>{user.email}</div>
                  <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
                    Role: {user.role} | Usage: {`${user.weeklyUploadCount}/3`}
                  </div>
                  {user.referralCode && (
                    <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
                      Referral code: {user.referralCode}
                    </div>
                  )}
                  <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
                    Joined: {new Date(user.createdAt).toLocaleString()}
                  </div>
                </div>

                <AdminResetUsageButton userId={user.id} />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: "40px" }}>
          <div className="card-title">Launch Readiness</div>

          <div style={{ marginTop: "18px", fontSize: "42px", fontWeight: 900 }}>
            {launchReadyPercent}%
          </div>

          <p className="gray" style={{ marginTop: "10px" }}>
            {launchReadyCount}/{launchChecklist.length} launch checks completed.
          </p>

          <div style={{ display: "grid", gap: "12px", marginTop: "22px" }}>
            {launchChecklist.map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: item.done
                    ? "rgba(34,197,94,0.10)"
                    : "rgba(248,113,113,0.08)",
                  border: item.done
                    ? "1px solid rgba(34,197,94,0.20)"
                    : "1px solid rgba(248,113,113,0.18)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <strong>{item.label}</strong>
                <span style={{ color: item.done ? "#4ade80" : "#f87171", fontWeight: 900 }}>
                  {item.done ? "Ready" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: "40px" }}>
          <div className="card-title">Recent Contact Messages</div>
          <p className="gray" style={{ marginTop: "10px", lineHeight: 1.6 }}>
            Partner-pilot leads: {totalPartnerPilotLeads} total · {openPartnerPilotLeads} open · {duePartnerPilotLeads} due for follow-up. Set a next action after every response so partner conversion is measurable.
          </p>

          {contactMessages.length === 0 ? (
            <p className="gray">No contact messages yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {contactMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    padding: "18px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: "17px" }}>
                    {message.subject || "No subject"}
                  </div>

                  <div className="gray" style={{ marginTop: "8px" }}>
                    {message.name || "No name"} — {message.email}
                  </div>

                  <div style={{ marginTop: "12px", lineHeight: 1.7 }}>
                    {message.message}
                  </div>

                  {message.source === "partner_pilot" && pilotProfileSummary(message.pilotProfile) && (
                    <div
                      className="gray"
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "rgba(99,102,241,0.10)",
                        border: "1px solid rgba(129,140,248,0.18)",
                        fontSize: "13px",
                        lineHeight: 1.6,
                      }}
                    >
                      Pilot profile: {pilotProfileSummary(message.pilotProfile)}
                    </div>
                  )}

                  <div className="gray" style={{ marginTop: "10px", fontSize: "13px" }}>
                    {new Date(message.createdAt).toLocaleString()}
                  </div>

                  {message.nextActionAt && (
                    <div
                      style={{
                        marginTop: "10px",
                        color: message.nextActionAt <= now && message.status !== "CLOSED" ? "#fca5a5" : "#cbd5e1",
                        fontSize: "13px",
                        fontWeight: 800,
                      }}
                    >
                      Next action: {new Date(message.nextActionAt).toLocaleDateString()}
                      {message.nextActionAt <= now && message.status !== "CLOSED" ? " · Due" : ""}
                    </div>
                  )}

                  {message.internalNote && (
                    <div className="gray" style={{ marginTop: "8px", fontSize: "13px", lineHeight: 1.6 }}>
                      Internal note: {message.internalNote}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "5px 9px",
                        borderRadius: "999px",
                        background: message.source === "partner_pilot" ? "rgba(99,102,241,0.20)" : "rgba(255,255,255,0.08)",
                        color: message.source === "partner_pilot" ? "#c7d2fe" : "#cbd5e1",
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      {message.source === "partner_pilot" ? "Partner pilot" : "General support"}
                    </span>
                  </div>

                  <ContactMessageStatus
                    messageId={message.id}
                    initialStatus={message.status}
                    initialNextActionAt={message.nextActionAt?.toISOString() || null}
                    initialInternalNote={message.internalNote}
                  />

                  <DeleteContactMessageButton messageId={message.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: "40px" }}>
          <div className="card-title">Recent Events</div>

          {events.length === 0 ? (
            <p className="gray">No events yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>{event.type}</div>

                  <div className="gray" style={{ marginTop: "6px" }}>
                    {new Date(event.createdAt).toLocaleString()}
                  </div>

                  <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
                    User: {event.userId || "N/A"} | Report: {event.reportId || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
