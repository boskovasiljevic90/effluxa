import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

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
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

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

            {isAdmin && (
              <Link href="/dashboard/admin" className="sidebar-item">
                Admin
              </Link>
            )}

            <LogoutButton />
          </div>
        </aside>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
