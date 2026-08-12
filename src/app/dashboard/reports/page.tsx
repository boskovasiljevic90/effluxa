export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { getWorkspaceOwner } from "@/lib/workspace";
import { isFallbackReport } from "@/lib/reportDisplay";

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
    clientId?: string;
  };
}) {
  const user = await getUser();

  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);

  const q = searchParams?.q?.trim() || "";
  const status = searchParams?.status || "all";
  const clientId = searchParams?.clientId || "";

  const clients = await prisma.client.findMany({
    where: { ownerId: workspace.owner.id },
    orderBy: { name: "asc" },
  });

  const reports = await prisma.upload.findMany({
    where: {
      userId: workspace.owner.id,
      ...(status === "unlocked" ? { unlocked: true } : {}),
      ...(status === "preview" ? { unlocked: false } : {}),
      ...(clientId ? { clientId } : {}),
      ...(q
        ? {
            fileUrl: {
              contains: q,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const makeHref = (nextStatus: string) => {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (clientId) params.set("clientId", clientId);
    if (nextStatus !== "all") params.set("status", nextStatus);

    const query = params.toString();
    return `/dashboard/reports${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <h1 style={{ fontSize: "42px" }}>Your AI Audit Reports</h1>

      <p className="gray" style={{ marginTop: "10px" }}>
        Search, filter, and open previous Effluxa financial leak audits.
      </p>

      <div style={{ marginTop: "28px", marginBottom: "18px" }}>
        <a href="/api/reports/pdf" style={{ marginRight: "12px" }}>
          <button className="primary-button">
            Export Workspace PDF
          </button>
        </a>

        <a href="/api/reports/export">
          <button className="primary-button">
            Export Workspace CSV
          </button>
        </a>
      </div>

      <div className="card" style={{ marginTop: "34px", marginBottom: "28px" }}>
        <form
          action="/dashboard/reports"
          style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search reports by filename..."
            style={{
              flex: 1,
              minWidth: "240px",
              padding: "14px 16px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontSize: "15px",
            }}
          />

          {status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}

          {clientId && <input type="hidden" name="clientId" value={clientId} />}

          <button className="primary-button" type="submit">
            Search
          </button>
        </form>

        {clients.length > 0 && (
          <div style={{ marginTop: "22px" }}>
            <div className="gray" style={{ marginBottom: "10px", fontWeight: 700 }}>
              Filter by Client
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href={makeHref(status)}>
                <button
                  style={{
                    padding: "10px 16px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: !clientId
                      ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                      : "rgba(255,255,255,0.06)",
                    color: "white",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  All Clients
                </button>
              </Link>

              {clients.map((client) => {
                const params = new URLSearchParams();

                if (q) params.set("q", q);
                if (status !== "all") params.set("status", status);
                params.set("clientId", client.id);

                return (
                  <Link key={client.id} href={`/dashboard/reports?${params.toString()}`}>
                    <button
                      style={{
                        padding: "10px 16px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background:
                          clientId === client.id
                            ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                            : "rgba(255,255,255,0.06)",
                        color: "white",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {client.name}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "22px",
          }}
        >
          {[
            ["all", "All"],
            ["unlocked", "Unlocked"],
            ["preview", "Preview"],
          ].map(([value, label]) => (
            <Link key={value} href={makeHref(value)}>
              <button
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background:
                    status === value
                      ? "linear-gradient(135deg, #2563eb, #7c3aed)"
                      : "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        {reports.length === 0 ? (
          <p className="gray">No reports found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reports.map((report) => {
              const data = report.parsedData as any;
              const reportIsUnlocked =
                report.unlocked ||
                user.role === "PRO" ||
                workspace.hasBusinessAccess;

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

                        <div className="gray" style={{ marginTop: "8px" }}>
                          Estimated Savings: {reportIsUnlocked
                            ? `€${data?.estimated_savings?.toLocaleString?.() || "N/A"}`
                            : "Locked until full audit is unlocked"}
                        </div>

                        {report.internalNote && (
                          <div className="gray" style={{ marginTop: "8px", color: "#4ade80" }}>
                            Internal note saved
                          </div>
                        )}

                        {report.clientId && (
                          <div className="gray" style={{ marginTop: "8px" }}>
                            Client: {clients.find((client) => client.id === report.clientId)?.name || "Assigned client"}
                          </div>
                        )}

                        {isFallbackReport(data) && (
                          <div className="gray" style={{ marginTop: "8px", color: "#facc15" }}>
                            Limited-data report
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          padding: "9px 15px",
                          borderRadius: "999px",
                          background: reportIsUnlocked
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(255,255,255,0.08)",
                          color: reportIsUnlocked ? "#4ade80" : "#cbd5e1",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        {reportIsUnlocked ? "UNLOCKED" : "PREVIEW"}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
