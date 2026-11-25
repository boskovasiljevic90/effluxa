export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { getWorkspaceOwner } from "@/lib/workspace";
import { isFallbackReport } from "@/lib/reportDisplay";
import AuditJobCard from "./AuditJobCard";

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

  const auditJobs = await prisma.auditJob.findMany({
    where: {
      workspaceOwnerId: workspace.owner.id,
      status: { in: ["QUEUED", "PROCESSING", "RETRYABLE", "FAILED"] },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      status: true,
      attemptCount: true,
      maxAttempts: true,
      reportId: true,
      lastError: true,
      nextAttemptAt: true,
      createdAt: true,
      updatedAt: true,
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


  function friendlyName(report: { id: string; parsedData: unknown; fileUrl: string }) {
    const data = report.parsedData as any;
    const raw = typeof data?.source_file === "string" ? data.source_file : "";
    const base = raw.split(/[\\/]/).pop()?.trim() || "";
    if (base && !/^(instant|seed):/i.test(base) && base.length <= 64) return base;
    if (report.fileUrl && !/^(instant|seed):/i.test(report.fileUrl) && report.fileUrl.length <= 64) {
      return report.fileUrl.split(/[\\/]/).pop() || "Financial audit";
    }
    return "Financial audit";
  }

  const statusFilters: Array<[string, string]> = [
    ["all", "All"],
    ["unlocked", "Unlocked"],
    ["preview", "Preview"],
  ];

  const chipStyle = (active: boolean) => ({
    padding: "8px 14px",
    borderRadius: "999px",
    border: active ? "1px solid transparent" : "1px solid rgba(148,163,184,0.25)",
    background: active ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "rgba(255,255,255,0.045)",
    color: active ? "#fff" : "#cbd5e1",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  });

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <p className="dash-eyebrow">Reports</p>
          <h1 className="dash-title">Audit reports</h1>
          <p className="dash-sub">Search, filter and open previous Effluxa financial leak audits.</p>
        </div>
        <div className="dash-head-actions">
          <a href="/api/reports/pdf" className="dash-btn dash-btn-ghost">
            Export PDF
          </a>
          <a href="/api/reports/export" className="dash-btn dash-btn-ghost">
            Export CSV
          </a>
          <Link href="/dashboard/upload" className="dash-btn dash-btn-primary">
            New audit
          </Link>
        </div>
      </div>

      {auditJobs.length > 0 && (
        <section className="dash-card" style={{ marginBottom: "22px" }}>
          <div className="dash-card-head">
            <h2 className="dash-card-title">Audit processing</h2>
            <span className="dash-meta">Jobs continue in the background</span>
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            {auditJobs.map((job) => (
              <AuditJobCard
                key={job.id}
                initialJob={{
                  ...job,
                  status: job.status as "QUEUED" | "PROCESSING" | "RETRYABLE" | "COMPLETE" | "FAILED",
                  createdAt: job.createdAt.toISOString(),
                  updatedAt: job.updatedAt.toISOString(),
                  nextAttemptAt: job.nextAttemptAt?.toISOString() || null,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="dash-card" style={{ marginBottom: "22px" }}>
        <form
          action="/dashboard/reports"
          style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search reports by file name"
            style={{ flex: "1 1 260px", minWidth: 0 }}
          />
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          {clientId && <input type="hidden" name="clientId" value={clientId} />}
          <button className="dash-btn dash-btn-primary" type="submit">
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
          {statusFilters.map(([value, label]) => (
            <Link key={value} href={makeHref(value)} style={{ textDecoration: "none" }}>
              <span style={chipStyle(status === value)}>{label}</span>
            </Link>
          ))}
        </div>

        {clients.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
            <Link href={makeHref(status)} style={{ textDecoration: "none" }}>
              <span style={chipStyle(!clientId)}>All clients</span>
            </Link>
            {clients.map((client) => {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (status !== "all") params.set("status", status);
              params.set("clientId", client.id);

              return (
                <Link key={client.id} href={`/dashboard/reports?${params.toString()}`} style={{ textDecoration: "none" }}>
                  <span style={chipStyle(clientId === client.id)}>{client.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="dash-card">
        <div className="dash-card-head">
          <h2 className="dash-card-title">All reports</h2>
          <span className="dash-meta">{reports.length} total</span>
        </div>

        {reports.length === 0 ? (
          <div className="dash-empty">
            No reports found for this filter.
            <div style={{ marginTop: "16px" }}>
              <Link href="/dashboard/upload" className="dash-btn dash-btn-primary">
                Start a new audit
              </Link>
            </div>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Date</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const data = report.parsedData as any;
                const reportIsUnlocked =
                  report.unlocked || user.role === "PRO" || workspace.hasBusinessAccess;
                const client = clients.find((item) => item.id === report.clientId);
                const score = Number(data?.leakage_score);

                return (
                  <tr key={report.id}>
                    <td>
                      <Link href={`/dashboard/reports/${report.id}`} style={{ textDecoration: "none" }}>
                        <div className="dash-file">{friendlyName(report)}</div>
                        <div className="dash-meta">
                          {client ? client.name : "Own file"}
                          {isFallbackReport(data) ? " · limited data" : ""}
                          {report.internalNote ? " · internal note" : ""}
                        </div>
                      </Link>
                    </td>
                    <td>{new Date(report.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td>
                      <span className="dash-score">
                        {Number.isFinite(score) && score > 0 ? `${Math.round(score)}/100` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`dash-badge ${reportIsUnlocked ? "dash-badge-ok" : "dash-badge-wait"}`}>
                        {reportIsUnlocked ? "Unlocked" : "Preview"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
