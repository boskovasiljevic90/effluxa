import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const usersCount = await prisma.user.count();
  const reportsCount = await prisma.upload.count();
  const unlockedReportsCount = await prisma.upload.count({
    where: { unlocked: true },
  });

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const checkoutCount = await prisma.event.count({
    where: { type: "checkout_created" },
  });

  const revenueEvents = await prisma.event.count({
    where: { type: "report_unlocked" },
  });

  const estimatedRevenue = revenueEvents * 29;

  const conversionRate =
    reportsCount > 0
      ? Math.round((unlockedReportsCount / reportsCount) * 100)
      : 0;

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
            <div className="card-title">Total Audits</div>
            <div className="metric-value">{reportsCount}</div>
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
