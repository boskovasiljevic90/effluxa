export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOperationalAdminFromToken } from "@/lib/adminAuth";
import AdminResetUsageButton from "./AdminResetUsageButton";
import DeleteContactMessageButton from "./DeleteContactMessageButton";
import DeleteEventButton from "./DeleteEventButton";
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
      createdAt: true,
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const usersCount = await prisma.user.count();

  const businessUsersCount = await prisma.user.count({
    where: { role: "BUSINESS" },
  });

  const activeBusinessUsersCount = await prisma.user.count({
    where: {
      role: "BUSINESS",
      subscriptionStatus: "active",
      OR: [
        { subscriptionEndDate: null },
        { subscriptionEndDate: { gt: new Date() } },
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
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const errorEvents = await prisma.event.findMany({
    where: {
      type: {
        contains: "error",
      },
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
    where: { type: "report_unlocked" },
  });

  const estimatedRevenue = revenueEvents * 29;

  const signupEventsCount = await prisma.event.count({
    where: { type: "signup" },
  });

  const uploadEventsCount = await prisma.event.count({
    where: { type: "upload_created" },
  });

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
    _count: { type: true },
    orderBy: { _count: { type: "desc" } },
    take: 10,
  });

  const signupToUploadRate =
    signupEventsCount > 0
      ? Math.round((uploadEventsCount / signupEventsCount) * 100)
      : 0;

  const uploadToUnlockRate =
    uploadEventsCount > 0
      ? Math.round((revenueEvents / uploadEventsCount) * 100)
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
            <div className="card-title">Estimated Revenue</div>
            <div className="metric-value green">€{estimatedRevenue}</div>
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
              <div className="card-title">Signup → Upload</div>
              <div className="metric-value">{signupToUploadRate}%</div>
            </div>

            <div className="card">
              <div className="card-title">Upload → Unlock</div>
              <div className="metric-value">{uploadToUnlockRate}%</div>
            </div>

            <div className="card">
              <div className="card-title">Business Conversion</div>
              <div className="metric-value green">{businessConversionRate}%</div>
            </div>
          </div>
        </div>

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
