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
import { hasActiveAgencyAccess } from "@/lib/complimentaryAccess";
import { getReferralLink } from "@/lib/referrals";

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

  const checkoutCount = await prisma.event.count({
    where: { type: "checkout_created" },
  });

  const revenueEvents = await prisma.event.count({
    where: { type: "full_audit_unlocked" },
  });

  const signupEventsCount = await prisma.event.count({
    where: { type: "signup" },
  });

  const uploadEventsCount = await prisma.event.count({
    where: { type: "upload_created" },
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
        (sum, action) => sum + (Number(action.resolvedAmount) || 0),
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

                  <div className="gray" style={{ marginTop: "10px", fontSize: "13px" }}>
                    {new Date(message.createdAt).toLocaleString()}
                  </div>

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
