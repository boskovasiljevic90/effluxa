import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const workspace = user ? await getWorkspaceOwner(user) : null;
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;
  const displayPlan = workspace?.hasBusinessAccess ? "BUSINESS" : user?.role || "FREE";

  let unreadNotificationsCount = 0;

  if (user && workspace) {
    const rawEvents = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    unreadNotificationsCount = rawEvents.filter((event) => {
      const metadata = event.metadata as any;

      const belongsToWorkspace =
        event.userId === user.id ||
        event.userId === workspace.owner.id ||
        metadata?.workspaceOwnerId === workspace.owner.id;

      const unread =
        !user.notificationLastSeenAt ||
        event.createdAt > user.notificationLastSeenAt;

      return belongsToWorkspace && unread;
    }).length;
  }

  return (
    <div className="page-container">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <Link href="/dashboard">
            <div className="logo">
              Eff<span>luxa</span>
            </div>
          </Link>

          <div className="sidebar-subtitle">
            AI Financial Leak Audit
          </div>

          <div className="sidebar-menu">
            <Link href="/dashboard" className="sidebar-item">
              Dashboard
            </Link>

            <Link href="/dashboard/reports" className="sidebar-item">
              Reports
            </Link>

            {workspace?.hasBusinessAccess && (
              <Link href="/dashboard/clients" className="sidebar-item">
                Clients
              </Link>
            )}

            {workspace?.hasBusinessAccess && (
              <Link href="/dashboard/portfolio" className="sidebar-item">
                Portfolio
              </Link>
            )}

            <Link href="/dashboard/upload" className="sidebar-item">
              Upload Audit
            </Link>

            <Link href="/dashboard/notifications" className="sidebar-item">
              Notifications{unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount})` : ""}
            </Link>

            <Link href="/dashboard/settings" className="sidebar-item">
              Settings
            </Link>

            {workspace?.hasBusinessAccess && workspace?.isOwner && (
              <Link href="/dashboard/team" className="sidebar-item">
                Team
              </Link>
            )}

            {isAdmin && (
              <Link href="/dashboard/admin" className="sidebar-item">
                Admin
              </Link>
            )}

            <div className="sidebar-plan-card">
              <div className="sidebar-plan-title">Current Plan</div>
              <div className="sidebar-plan-value">
                {displayPlan}
              </div>

              {workspace?.isTeamMember && (
                <div className="sidebar-plan-title" style={{ marginTop: "8px" }}>
                  Team Workspace
                </div>
              )}
            </div>

            <div className="sidebar-user-email">
              {user?.email}
            </div>

            <LogoutButton />
          </div>
        </aside>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
