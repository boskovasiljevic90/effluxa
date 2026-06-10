export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

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

export default async function ReportsPage() {
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
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <Link href="/dashboard" style={{ color: "#60a5fa" }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ fontSize: "42px", marginTop: "30px" }}>
          Your AI Audit Reports
        </h1>

        <p className="gray" style={{ marginTop: "10px" }}>
          View all previous Effluxa financial leak audits.
        </p>

        <div className="card" style={{ marginTop: "40px" }}>
          {reports.length === 0 ? (
            <p className="gray">No reports yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {reports.map((report) => {
                const data = report.parsedData as any;

                return (
                  <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                    <div
                      style={{
                        padding: "22px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "20px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                            {report.fileUrl}
                          </div>

                          <div className="gray" style={{ marginTop: "8px" }}>
                            {new Date(report.createdAt).toLocaleString()}
                          </div>

                          <div className="gray" style={{ marginTop: "8px" }}>
                            Leakage Score: {data?.leakage_score ?? "N/A"}/100
                          </div>
                        </div>

                        <div
                          style={{
                            padding: "9px 15px",
                            borderRadius: "999px",
                            background: report.unlocked
                              ? "rgba(34,197,94,0.15)"
                              : "rgba(255,255,255,0.08)",
                            color: report.unlocked ? "#4ade80" : "#cbd5e1",
                            fontWeight: "bold",
                            fontSize: "14px",
                          }}
                        >
                          {report.unlocked ? "UNLOCKED" : "PREVIEW"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
