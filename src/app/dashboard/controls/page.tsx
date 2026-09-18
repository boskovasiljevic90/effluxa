export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";

const STATUS_OPTIONS = [
  ["ALL", "All statuses"],
  ["OPEN", "Open"],
  ["IN_REVIEW", "In review"],
  ["ACTIONED", "Actioned"],
  ["DISMISSED", "Dismissed"],
] as const;

function statusLabel(status: string) {
  return STATUS_OPTIONS.find(([value]) => value === status)?.[1] || status;
}

function statusColor(status: string) {
  if (status === "ACTIONED") return "#86efac";
  if (status === "DISMISSED") return "#94a3b8";
  if (status === "IN_REVIEW") return "#facc15";
  return "#fca5a5";
}

function isOverdue(action: { status: string; dueDate: Date | null }, now: Date) {
  return Boolean(
    action.dueDate &&
      action.dueDate < now &&
      action.status !== "ACTIONED" &&
      action.status !== "DISMISSED"
  );
}

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

export default async function ControlsPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    clientId?: string;
    q?: string;
  };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceOwner(user);
  if (!workspace.hasBusinessAccess) redirect("/dashboard");

  const requestedStatus = searchParams?.status || "ALL";
  const status = STATUS_OPTIONS.some(([value]) => value === requestedStatus)
    ? requestedStatus
    : "ALL";
  const clientId = searchParams?.clientId || "";
  const query = searchParams?.q?.trim() || "";
  const now = new Date();

  const clients = await prisma.client.findMany({
    where: { ownerId: workspace.owner.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const workspaceWhere = { workspaceOwnerId: workspace.owner.id };
  const allActions = await prisma.controlAction.findMany({
    where: workspaceWhere,
    select: {
      status: true,
      dueDate: true,
      resolvedAmount: true,
    },
  });

  const actionWhere = {
    ...workspaceWhere,
    ...(status !== "ALL" ? { status } : {}),
    ...(clientId ? { report: { clientId } } : {}),
    ...(query
      ? {
          OR: [
            { findingTitle: { contains: query, mode: "insensitive" as const } },
            { findingCategory: { contains: query, mode: "insensitive" as const } },
            { ownerEmail: { contains: query, mode: "insensitive" as const } },
            { report: { fileUrl: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const actions = await prisma.controlAction.findMany({
    where: actionWhere,
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    take: 200,
    select: {
      id: true,
      reportId: true,
      findingId: true,
      findingTitle: true,
      ruleId: true,
      findingCategory: true,
      findingSeverity: true,
      recommendedAction: true,
      quantifiedAmount: true,
      currency: true,
      status: true,
      ownerEmail: true,
      dueDate: true,
      outcomeNote: true,
      resolvedAmount: true,
      updatedAt: true,
      report: {
        select: {
          fileUrl: true,
          client: { select: { name: true } },
        },
      },
    },
  });

  const openCount = allActions.filter((action) => action.status === "OPEN").length;
  const inReviewCount = allActions.filter((action) => action.status === "IN_REVIEW").length;
  const actionedCount = allActions.filter((action) => action.status === "ACTIONED").length;
  const overdueCount = allActions.filter((action) => isOverdue(action, now)).length;
  const verifiedRecovered = allActions.reduce(
    (sum, action) => sum + (Number(action.resolvedAmount) || 0),
    0
  );

  return (
    <>
      <h1 style={{ fontSize: "42px" }}>Control Center</h1>

      <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
        One workspace view for evidence-backed findings that still need review, ownership, or verification.
      </p>

      <p className="gray" style={{ marginTop: "8px", lineHeight: 1.6, fontSize: "13px" }}>
        Reminder cadence: overdue controls are checked daily and other open controls weekly. Email reminders contain aggregate counts only; open Control Center to view financial details. You can disable them in Settings.
      </p>

      <div className="report-grid" style={{ marginTop: "34px" }}>
        <div className="card">
          <div className="card-title">Open</div>
          <div className="metric-value">{openCount}</div>
        </div>
        <div className="card">
          <div className="card-title">In Review</div>
          <div className="metric-value">{inReviewCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Overdue</div>
          <div className="metric-value red">{overdueCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Actioned</div>
          <div className="metric-value green">{actionedCount}</div>
        </div>
        <div className="card full-width">
          <div className="card-title">Verified Recovered Amount</div>
          <div className="metric-value green">€{verifiedRecovered.toLocaleString()}</div>
          <p className="gray" style={{ marginTop: "8px" }}>
            Only amounts explicitly verified by your team are included.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div className="card-title">Filter Controls</div>
        <form
          action="/dashboard/controls"
          method="get"
          style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "end" }}
        >
          <label style={{ display: "grid", gap: "7px", flex: "1 1 200px", fontSize: "13px" }}>
            Search
            <input
              name="q"
              defaultValue={query}
              placeholder="Finding, owner, or report..."
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "7px", flex: "0 1 180px", fontSize: "13px" }}>
            Status
            <select
              name="status"
              defaultValue={status}
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
              }}
            >
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: "7px", flex: "0 1 220px", fontSize: "13px" }}>
            Client
            <select
              name="clientId"
              defaultValue={clientId}
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
              }}
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>

          <button className="primary-button" type="submit">Apply Filters</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: "28px" }}>
        <div className="card-title">Control Queue {actions.length >= 200 ? "(first 200)" : `(${actions.length})`}</div>

        {actions.length === 0 ? (
          <p className="gray" style={{ marginTop: "12px" }}>
            No control actions match this view. Open an unlocked structured report to track its evidence-backed findings.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
            {actions.map((action) => {
              const overdue = isOverdue(action, now);
              return (
                <div
                  key={action.id}
                  style={{
                    padding: "18px",
                    borderRadius: "16px",
                    background: overdue ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",
                    border: overdue
                      ? "1px solid rgba(248,113,113,0.22)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ color: statusColor(action.status), fontWeight: 900, fontSize: "13px" }}>
                          {statusLabel(action.status)}
                        </span>
                        {overdue && <span style={{ color: "#fca5a5", fontWeight: 800, fontSize: "13px" }}>Overdue</span>}
                        <strong>{action.findingTitle}</strong>
                      </div>
                      <div className="gray" style={{ marginTop: "8px", fontSize: "13px" }}>
                        {action.report.client?.name || "Unassigned client"} · {action.report.fileUrl}
                        {action.ruleId ? ` · ${action.ruleId}` : ""}
                      </div>
                    </div>

                    <Link href={`/dashboard/reports/${action.reportId}`}>
                      <button className="primary-button" style={{ padding: "9px 14px" }}>
                        Open Report
                      </button>
                    </Link>
                  </div>

                  <p style={{ marginTop: "14px", lineHeight: 1.7 }}>{action.recommendedAction}</p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
                      gap: "12px",
                      marginTop: "14px",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <div className="gray">Owner</div>
                      <div style={{ marginTop: "5px" }}>{action.ownerEmail || "Unassigned"}</div>
                    </div>
                    <div>
                      <div className="gray">Due</div>
                      <div style={{ marginTop: "5px" }}>
                        {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : "No due date"}
                      </div>
                    </div>
                    <div>
                      <div className="gray">Estimated exposure</div>
                      <div style={{ marginTop: "5px" }}>
                        {action.quantifiedAmount === null || action.quantifiedAmount === undefined
                          ? "Unquantified"
                          : `${action.currency} ${action.quantifiedAmount.toLocaleString()}`}
                      </div>
                    </div>
                    <div>
                      <div className="gray">Verified recovered</div>
                      <div style={{ marginTop: "5px", color: action.resolvedAmount !== null ? "#86efac" : "#cbd5e1" }}>
                        {action.resolvedAmount === null || action.resolvedAmount === undefined
                          ? "Not verified"
                          : `${action.currency} ${action.resolvedAmount.toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  {action.outcomeNote && (
                    <div className="gray" style={{ marginTop: "14px", lineHeight: 1.6 }}>
                      Outcome: {action.outcomeNote}
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
