"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function MobileDashboardNav({
  email,
  displayPlan,
  isAdmin,
  hasBusinessAccess,
  isOwner,
  isTeamMember,
  unreadNotificationsCount,
}: {
  email?: string | null;
  displayPlan: string;
  isAdmin: boolean;
  hasBusinessAccess: boolean;
  isOwner: boolean;
  isTeamMember: boolean;
  unreadNotificationsCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mobile-dashboard-bar">
        <button onClick={() => setOpen(true)} className="mobile-menu-button" aria-label="Open dashboard menu">
          ☰
        </button>

        <Link href="/dashboard" className="mobile-dashboard-logo">
          <img src="/brand/effluxa-wordmark.svg" alt="Effluxa" />
        </Link>

        <div className="mobile-profile-dot" aria-label="Account">
          ●
        </div>
      </div>

      {open && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-panel">
            <div className="mobile-menu-header">
              <Link href="/dashboard" className="mobile-dashboard-logo" onClick={() => setOpen(false)}>
                <img src="/brand/effluxa-wordmark.svg" alt="Effluxa" />
              </Link>

              <button onClick={() => setOpen(false)} className="mobile-menu-close" aria-label="Close dashboard menu">
                ×
              </button>
            </div>

            <div className="sidebar-subtitle">AI Financial Leak Audit</div>

            <div className="sidebar-menu">
              <Link href="/dashboard" className="sidebar-item" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/dashboard/reports" className="sidebar-item" onClick={() => setOpen(false)}>Reports</Link>

              {hasBusinessAccess && (
                <Link href="/dashboard/clients" className="sidebar-item" onClick={() => setOpen(false)}>Clients</Link>
              )}

              {hasBusinessAccess && (
                <Link href="/dashboard/portfolio" className="sidebar-item" onClick={() => setOpen(false)}>Portfolio</Link>
              )}

              <Link href="/dashboard/upload" className="sidebar-item" onClick={() => setOpen(false)}>Upload Audit</Link>

              <Link href="/dashboard/notifications" className="sidebar-item" onClick={() => setOpen(false)}>
                Notifications{unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount})` : ""}
              </Link>

              <Link href="/dashboard/settings" className="sidebar-item" onClick={() => setOpen(false)}>Settings</Link>

              {hasBusinessAccess && isOwner && (
                <Link href="/dashboard/team" className="sidebar-item" onClick={() => setOpen(false)}>Team</Link>
              )}

              {isAdmin && (
                <Link href="/dashboard/admin" className="sidebar-item" onClick={() => setOpen(false)}>Admin</Link>
              )}

              <div className="sidebar-plan-card">
                <div className="sidebar-plan-title">Current Plan</div>
                <div className="sidebar-plan-value">{displayPlan}</div>
                {isTeamMember && <div className="sidebar-plan-title" style={{ marginTop: "8px" }}>Team Workspace</div>}
              </div>

              <div className="sidebar-user-email">{email}</div>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
