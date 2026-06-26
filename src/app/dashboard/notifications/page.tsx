export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";
import MarkNotificationsReadButton from "./MarkNotificationsReadButton";

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

function notificationLabel(type: string, metadata: any) {
  if (type === "upload_created") return `${metadata?.uploadedBy || "A workspace user"} uploaded ${metadata?.fileName || "a financial document"}`;
  if (type === "report_unlocked") return "Audit report unlocked";
  if (type === "checkout_created") return "Checkout started";
  if (type === "business_subscription_activated") return "Business subscription activated";
  if (type === "business_subscription_cancelled") return "Business subscription cancelled";
  if (type === "business_subscription_payment_failed") return "Business subscription payment failed";
  if (type === "monthly_executive_summary_sent") return "Monthly executive summary sent";
  if (type === "first_audit_reminder_sent") return "First audit reminder sent";
  if (type === "team_invite_sent") return "Team invite sent";
  return type.replaceAll("_", " ");
}

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);

  const rawEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const events = rawEvents.filter((event) => {
    const metadata = event.metadata as any;

    return (
      event.userId === user.id ||
      event.userId === workspace.owner.id ||
      metadata?.workspaceOwnerId === workspace.owner.id
    );
  });

  const lastSeen = user.notificationLastSeenAt;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Notifications</div>
          <p className="gray" style={{ marginTop: "10px" }}>
            Recent workspace activity, automation events, and account updates.
          </p>
        </div>

        <MarkNotificationsReadButton />
      </div>

      <div className="card">
        {events.length === 0 ? (
          <p className="gray">No notifications yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {events.map((event) => {
              const metadata = event.metadata as any;
              const unread = !lastSeen || event.createdAt > lastSeen;

              return (
                <div
                  key={event.id}
                  style={{
                    padding: "18px",
                    borderRadius: "16px",
                    background: unread ? "rgba(96,165,250,0.10)" : "rgba(255,255,255,0.04)",
                    border: unread ? "1px solid rgba(96,165,250,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
                    <strong>{notificationLabel(event.type, metadata)}</strong>
                    {unread && <span style={{ color: "#60a5fa", fontWeight: 900 }}>NEW</span>}
                  </div>

                  <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                    {new Date(event.createdAt).toLocaleString()}
                  </div>

                  {event.reportId && (
                    <div style={{ marginTop: "10px" }}>
                      <Link href={`/dashboard/reports/${event.reportId}`} style={{ color: "#60a5fa" }}>
                        Open related report
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
