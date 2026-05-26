import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

async function getUser() {
  const token = cookies().get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
    };

    return await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const reports = await prisma.upload.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="page-container">
      <div className="dashboard-layout">
        <div className="sidebar">
          <div className="logo">
            Eff<span>luxa</span>
          </div>

          <div className="sidebar-menu">
            <Link href="/dashboard" className="sidebar-item">
              Dashboard
            </Link>

            <Link href="/dashboard/upload" className="sidebar-item">
              Upload Audit
            </Link>

            <LogoutButton />
          </div>
        </div>

        <div className="main-content">
          <div className="topbar">
            <div>
              <div className="page-title">
                AI Financial Intelligence
              </div>

              <p className="gray" style={{ marginTop: "10px" }}>
                Detect financial leakage and optimize operational spending.
              </p>
            </div>

            <div className="plan-badge plan-free">
              FREE
            </div>
          </div>


          <div
            className="card"
            style={{
              marginBottom: "28px",
            }}
          >
            <div className="card-title">
              Free Plan Usage
            </div>

            <p className="gray" style={{ marginTop: "12px" }}>
              You used {user.weeklyUploadCount}/3 free AI audits.
            </p>
          </div>

          <div
            className="card"
            style={{
              marginBottom: "28px",
            }}
          >
            <div className="card-title">
              Start New AI Audit
            </div>

            <p className="gray">
              Upload invoices, financial statements, operational expenses,
              or accounting documents for instant AI analysis.
            </p>

            <Link href="/dashboard/upload">
              <button
                className="primary-button"
                style={{
                  marginTop: "24px",
                }}
              >
                Upload Financial Document
              </button>
            </Link>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div className="card-title">
                Previous AI Audits
              </div>

              <div className="gray">
                {reports.length} total
              </div>
            </div>

            {reports.length === 0 ? (
              <p className="gray">
                No audits yet.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                  >
                    <div
                      style={{
                        padding: "20px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        transition: "0.2s ease",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "18px",
                          }}
                        >
                          {report.fileUrl}
                        </div>

                        <div
                          style={{
                            padding: "8px 14px",
                            borderRadius: "999px",
                            background: report.unlocked
                              ? "rgba(34,197,94,0.15)"
                              : "rgba(255,255,255,0.08)",
                            color: report.unlocked
                              ? "#4ade80"
                              : "#cbd5e1",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          {report.unlocked ? "UNLOCKED" : "PREVIEW"}
                        </div>
                      </div>

                      <div className="gray">
                        {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
