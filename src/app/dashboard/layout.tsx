import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";
import MobileDashboardNav from "./MobileDashboardNav";
import SidebarMenu, { type SidebarItem } from "./SidebarMenu";
import { displayPlanLabel } from "@/lib/planDisplay";

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
  const displayPlan = workspace?.hasBusinessAccess
    ? "AGENCY"
    : user?.role === "BUSINESS"
      ? "AGENCY INACTIVE"
      : displayPlanLabel(user?.role);

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

  const navItems: SidebarItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/reports", label: "Reports" },
    ...(workspace?.hasBusinessAccess
      ? [
          { href: "/dashboard/clients", label: "Clients" },
          { href: "/dashboard/portfolio", label: "Portfolio" },
          { href: "/dashboard/controls", label: "Controls" },
        ]
      : []),
    { href: "/dashboard/upload", label: "Upload Audit" },
    {
      href: "/dashboard/notifications",
      label: unreadNotificationsCount > 0 ? `Notifications (${unreadNotificationsCount})` : "Notifications",
    },
    { href: "/dashboard/settings", label: "Settings" },
    ...(user?.referralCode ? [{ href: "/dashboard/partner", label: "Partner Launchpad" }] : []),
    ...(workspace?.hasBusinessAccess && workspace?.isOwner ? [{ href: "/dashboard/team", label: "Team" }] : []),
    ...(isAdmin ? [{ href: "/dashboard/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="page-container">
      <MobileDashboardNav
        email={user?.email}
        displayPlan={displayPlan}
        isAdmin={isAdmin}
        hasBusinessAccess={Boolean(workspace?.hasBusinessAccess)}
        isOwner={Boolean(workspace?.isOwner)}
        isTeamMember={Boolean(workspace?.isTeamMember)}
        hasReferralCode={Boolean(user?.referralCode)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="dashboard-layout">
        <aside className="sidebar">
          <Link href="/dashboard">
            <div className="logo">
              <img src="/brand/effluxa-wordmark.svg" alt="Effluxa" />
            </div>
          </Link>

          <div className="sidebar-subtitle">
            AI Financial Leak Audit
          </div>

          <SidebarMenu items={navItems} />

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
        </aside>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
