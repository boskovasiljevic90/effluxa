import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-container">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <Link href="/dashboard">
            <div className="logo">
              Eff<span>luxa</span>
            </div>
          </Link>

          <div className="sidebar-menu">
            <Link href="/dashboard" className="sidebar-item">
              Dashboard
            </Link>

            <Link href="/dashboard/reports" className="sidebar-item">
              Reports
            </Link>

            <Link href="/dashboard/upload" className="sidebar-item">
              Upload Audit
            </Link>

            <Link href="/dashboard/admin" className="sidebar-item">
              Admin
            </Link>

            <LogoutButton />
          </div>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
