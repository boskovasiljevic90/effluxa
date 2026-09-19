export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";
import ReferralLinkActions from "../settings/ReferralLinkActions";
import { getReferralLink } from "@/lib/referrals";

async function getUser() {
  const token = cookies().get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
  } catch {
    return null;
  }
}

export default async function PartnerHubPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.referralCode) redirect("/dashboard/settings");

  const workspace = await getWorkspaceOwner(user);
  const referralLink = getReferralLink(user.referralCode);

  if (!workspace.hasBusinessAccess) {
    return (
      <>
        <div className="topbar">
          <div>
            <div className="page-title">Partner Launchpad</div>
            <p className="gray" style={{ marginTop: "10px" }}>
              Your partner tools are available when Agency access is active.
            </p>
          </div>
          <div className="plan-badge plan-free">AGENCY INACTIVE</div>
        </div>

        <div className="card full-width" style={{ marginTop: "28px" }}>
          <div className="card-title">Agency workspace inactive</div>
          <p className="gray" style={{ marginTop: "12px", lineHeight: 1.7 }}>
            Client workspaces, recurring audits and control follow-up are protected until your Agency subscription or complimentary access is active again.
          </p>
          <div style={{ marginTop: "18px" }}>
            <Link href="/dashboard/settings">
              <button className="primary-button">Open billing settings</button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const now = new Date();
  const [clients, clientAuditCounts, controlActions] = await Promise.all([
    prisma.client.findMany({
      where: { ownerId: workspace.owner.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        notes: true,
        uploads: {
          orderBy: { createdAt: "desc" },
          take: 2,
          select: {
            id: true,
            fileUrl: true,
            parsedData: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.upload.groupBy({
      by: ["clientId"],
      where: {
        userId: workspace.owner.id,
        clientId: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.controlAction.findMany({
      where: { workspaceOwnerId: workspace.owner.id },
      select: {
        status: true,
        dueDate: true,
        report: {
          select: { clientId: true },
        },
      },
    }),
  ]);

  const clientAuditCountById = new Map<string, number>();
  for (const row of clientAuditCounts) {
    if (row.clientId) clientAuditCountById.set(row.clientId, row._count._all);
  }

  const controlSummaryByClient = new Map<string, { open: number; overdue: number }>();
  for (const action of controlActions) {
    const clientId = action.report.clientId;
    if (!clientId) continue;

    const current = controlSummaryByClient.get(clientId) || { open: 0, overdue: 0 };
    const resolved = action.status === "ACTIONED" || action.status === "DISMISSED";

    if (!resolved) {
      current.open += 1;
      if (action.dueDate && action.dueDate < now) current.overdue += 1;
    }

    controlSummaryByClient.set(clientId, current);
  }

  const clientRows = clients.map((client) => {
    const latestAudit = client.uploads[0];
    const latestData = latestAudit?.parsedData as any;
    const rawLeakageScore = Number(latestData?.leakage_score);
    const rawPotentialSavings = Number(latestData?.estimated_savings);
    const controls = controlSummaryByClient.get(client.id) || { open: 0, overdue: 0 };
    const auditCount = clientAuditCountById.get(client.id) || 0;

    return {
      id: client.id,
      name: client.name,
      notes: client.notes,
      auditCount,
      latestAuditAt: latestAudit?.createdAt || null,
      latestReportId: latestAudit?.id || null,
      latestLeakageScore: Number.isFinite(rawLeakageScore) ? Math.max(0, Math.min(100, Math.round(rawLeakageScore))) : null,
      latestPotentialSavings: Number.isFinite(rawPotentialSavings) ? Math.max(0, rawPotentialSavings) : null,
      openControls: controls.open,
      overdueControls: controls.overdue,
      nextAuditHref: `/dashboard/upload?clientId=${encodeURIComponent(client.id)}${latestAudit ? "&repeat=1" : ""}`,
    };
  });

  const auditedClientCount = clientRows.filter((client) => client.auditCount > 0).length;
  const openControlCount = clientRows.reduce((sum, client) => sum + client.openControls, 0);
  const overdueControlCount = clientRows.reduce((sum, client) => sum + client.overdueControls, 0);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Partner Launchpad</div>
          <p className="gray" style={{ marginTop: "10px" }}>
            Everything needed to start a focused Effluxa pilot with one finance professional.
          </p>
        </div>
        <div className="plan-badge plan-free">PARTNER</div>
      </div>

      <div
        className="card full-width"
        style={{
          marginTop: "28px",
          border: "1px solid rgba(129,140,248,0.38)",
          background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(37,99,235,0.08))",
        }}
      >
        <div className="card-title">The first pilot conversation</div>
        <h1 style={{ marginTop: "12px", fontSize: "32px", lineHeight: 1.15 }}>
          Start with one approved file and one concrete question.
        </h1>
        <p className="gray" style={{ marginTop: "14px", maxWidth: "780px", lineHeight: 1.7 }}>
          The strongest first use case is not a broad software demo. Ask an accounting, bookkeeping, fractional-CFO or SME finance contact to choose one recent invoice batch, bank statement, CSV export or expense file they are allowed to review.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: "12px",
            marginTop: "22px",
          }}
        >
          {[
            ["1", "Context", "What spend, vendor or control question do you want to examine?"],
            ["2", "Permission", "Use an approved, redacted file. Never upload data without the client's permission."],
            ["3", "Evidence", "Review source context, confidence and recommended action together."],
            ["4", "Follow-up", "Track ownership and compare the next period instead of promising guaranteed savings."],
          ].map(([number, title, description]) => (
            <div
              key={number}
              style={{
                padding: "17px",
                borderRadius: "14px",
                background: "rgba(15,23,42,0.28)",
                border: "1px solid rgba(199,210,254,0.14)",
              }}
            >
              <div style={{ color: "#c7d2fe", fontWeight: 950 }}>{number}</div>
              <div style={{ marginTop: "8px", fontWeight: 850 }}>{title}</div>
              <div className="gray" style={{ marginTop: "6px", fontSize: "13px", lineHeight: 1.55 }}>
                {description}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "22px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/for-accounting-firms">
            <button className="primary-button">Open partner positioning</button>
          </Link>
          <Link href="/sample-audit">
            <button className="primary-button" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              Open sample audit
            </button>
          </Link>
          <Link href="/dashboard/upload">
            <button className="primary-button" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              Upload your pilot file
            </button>
          </Link>
        </div>
      </div>

      <div className="report-grid" style={{ marginTop: "28px" }}>
        <div className="card">
          <div className="card-title">Client Workspaces</div>
          <div className="metric-value">{clientRows.length}</div>
        </div>
        <div className="card">
          <div className="card-title">Clients With Audits</div>
          <div className="metric-value green">{auditedClientCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Open Controls</div>
          <div className="metric-value">{openControlCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Overdue Follow-ups</div>
          <div className="metric-value" style={{ color: overdueControlCount > 0 ? "#fb923c" : "#4ade80" }}>
            {overdueControlCount}
          </div>
        </div>
      </div>

      <div className="card full-width" style={{ marginTop: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="card-title">Client control board</div>
            <p className="gray" style={{ marginTop: "8px", lineHeight: 1.6 }}>
              Move from one-off reports to repeatable client review. Potential savings are review signals, not verified recovered cash.
            </p>
          </div>
          <Link href="/dashboard/clients">
            <button className="primary-button" style={{ padding: "9px 14px" }}>Manage clients</button>
          </Link>
        </div>

        {clientRows.length === 0 ? (
          <div
            style={{
              marginTop: "18px",
              padding: "18px",
              borderRadius: "14px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(129,140,248,0.20)",
            }}
          >
            <strong>Create the first client workspace</strong>
            <p className="gray" style={{ marginTop: "8px", lineHeight: 1.6 }}>
              Add a client before the pilot audit so the next reporting period can be compared in one history.
            </p>
            <Link href="/dashboard/clients">
              <button className="primary-button" style={{ marginTop: "14px" }}>Create first client</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
            {clientRows.map((client) => (
              <div
                key={client.id}
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 850 }}>{client.name}</div>
                    {client.notes && (
                      <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>{client.notes}</div>
                    )}
                  </div>
                  <div className="gray" style={{ fontSize: "13px" }}>
                    {client.latestAuditAt
                      ? `Last audit ${new Date(client.latestAuditAt).toLocaleDateString()}`
                      : "No audit yet"}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                    gap: "10px",
                    marginTop: "16px",
                  }}
                >
                  <div className="gray" style={{ fontSize: "13px" }}>Audits<strong style={{ display: "block", color: "white", fontSize: "20px", marginTop: "4px" }}>{client.auditCount}</strong></div>
                  <div className="gray" style={{ fontSize: "13px" }}>Latest leakage<strong style={{ display: "block", color: "white", fontSize: "20px", marginTop: "4px" }}>{client.latestLeakageScore === null ? "—" : `${client.latestLeakageScore}/100`}</strong></div>
                  <div className="gray" style={{ fontSize: "13px" }}>Open controls<strong style={{ display: "block", color: client.openControls > 0 ? "#facc15" : "#4ade80", fontSize: "20px", marginTop: "4px" }}>{client.openControls}</strong></div>
                  <div className="gray" style={{ fontSize: "13px" }}>Potential in latest audit<strong style={{ display: "block", color: "white", fontSize: "20px", marginTop: "4px" }}>{client.latestPotentialSavings === null ? "—" : `€${client.latestPotentialSavings.toLocaleString()}`}</strong></div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                  <Link href={`/dashboard/clients/${client.id}`}>
                    <button className="primary-button" style={{ padding: "9px 14px" }}>Open client dashboard</button>
                  </Link>
                  {client.latestReportId && (
                    <Link href={`/dashboard/reports/${client.latestReportId}`}>
                      <button className="primary-button" style={{ padding: "9px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>Open latest audit</button>
                    </Link>
                  )}
                  <Link href={client.nextAuditHref}>
                    <button className="primary-button" style={{ padding: "9px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
                      {client.latestReportId ? "Run next-period audit" : "Upload first client audit"}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card full-width" style={{ marginTop: "28px" }}>
        <div className="card-title">Your referral invitation</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          This link attributes a new signup to your partner account for 30 days. It contains no customer data and is safe to share with the person you are inviting.
        </p>
        <div
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            wordBreak: "break-all",
            color: "#bfdbfe",
          }}
        >
          {referralLink}
        </div>
        <ReferralLinkActions referralLink={referralLink} />
      </div>

      <div className="card full-width" style={{ marginTop: "28px" }}>
        <div className="card-title">Responsible pilot language</div>
        <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
          Present Effluxa as a fast screening and control-follow-up layer. Findings are review signals, not guaranteed losses; estimated savings are not recovered cash; and the finance professional remains responsible for validating the source evidence before action.
        </p>
        <div style={{ marginTop: "18px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/resources">
            <button className="primary-button" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              Open audit resources
            </button>
          </Link>
          <Link href="/contact?subject=Partner%20pilot&source=partner_pilot">
            <button className="primary-button">Request partner support</button>
          </Link>
        </div>
      </div>
    </>
  );
}
