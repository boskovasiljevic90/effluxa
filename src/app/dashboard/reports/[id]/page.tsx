export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import UpgradeButton from "./UpgradeButton";
import DeleteReportButton from "./DeleteReportButton";
import ShareReportButton from "./ShareReportButton";
import ChangeReportClientForm from "./ChangeReportClientForm";
import InternalNoteForm from "./InternalNoteForm";
import { getWorkspaceOwner } from "@/lib/workspace";
import { canAccessFullReport } from "@/lib/access";
import { asCategoryItems, asRiskItems, asTextArray, asVendorItems, displayNumber, getReportQualityReason, isFallbackReport } from "@/lib/reportDisplay";

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

interface Props {
  params: {
    id: string;
  };
}

export default async function ReportPage({ params }: Props) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await getWorkspaceOwner(user);
  const reportId = params.id;

  let report = await prisma.upload.findFirst({
    where: {
      id: reportId,
      userId: workspace.owner.id,
    },
    include: {
      client: true,
    },
  });

  if (!report) {
    return <div style={{ padding: "40px" }}>Report not found.</div>;
  }

  const data = report.parsedData as any;
  const isUnlocked = canAccessFullReport({ report, user, workspace });
  const isLimitedDataReport = isFallbackReport(data);
  const reportQualityReason = getReportQualityReason(data);

  const quickWins = asTextArray(data?.quick_wins, [
    "No quick wins were detected in the uploaded data.",
  ]);
  const highCostCategories = asCategoryItems(data?.high_cost_categories, [
    {
      category: "No high-cost category detected",
      amount: 0,
      reason: "The uploaded data did not contain enough category detail.",
    },
  ]);
  const duplicatePaymentRisks = asRiskItems(data?.duplicate_payment_risks, [
    {
      item: "No duplicate payment risk confirmed",
      reason: "The uploaded data did not contain enough detail to confirm duplicate payments.",
    },
  ]);
  const cashflowObservations = asTextArray(data?.cashflow_observations, [
    "Cash flow patterns could not be reliably assessed from the uploaded data.",
  ]);
  const keyFindings = asTextArray(data?.key_findings, asTextArray(data?.recommendations, [
    "No key findings were generated from the uploaded data.",
  ]));
  const topVendors = asVendorItems(data?.top_vendors, [
    {
      vendor: "No vendor data available",
      amount: 0,
      reason: "The uploaded data did not contain reliable vendor-level detail.",
    },
  ]);
  const recommendations = asTextArray(data?.recommendations, [
    "No AI recommendations were generated from the uploaded data.",
  ]);
  const anomalies = asRiskItems(data?.anomalies);
  const leakageScore = Math.max(0, Math.min(100, Math.round(displayNumber(data?.leakage_score))));
  const estimatedSavings = Math.max(0, displayNumber(data?.estimated_savings));
  const riskLevel = data?.risk_level || "Insufficient data";
  const confidenceLevel = data?.confidence_level || "Insufficient data";
  const executiveSummary =
    data?.executive_summary ||
    data?.summary ||
    "Effluxa detected financial optimization opportunities in this document.";
  const cfoSummary = data?.cfo_summary || "Insufficient data";
  const visibleSavings = isUnlocked ? estimatedSavings : null;
  const visibleRiskLevel = isUnlocked ? riskLevel : "Unlock to view";
  const visibleConfidence = isUnlocked ? confidenceLevel : "Included in full audit";

  const previousClientAudit = report.clientId
    ? await prisma.upload.findFirst({
        where: {
          userId: workspace.owner.id,
          clientId: report.clientId,
          createdAt: {
            lt: report.createdAt,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : null;

  const previousData = previousClientAudit?.parsedData as any;
  const currentLeakage = leakageScore;
  const previousLeakage = displayNumber(previousData?.leakage_score);
  const leakagePointChange = previousClientAudit
    ? currentLeakage - previousLeakage
    : 0;
  const leakageImprovement = previousClientAudit
    ? previousLeakage - currentLeakage
    : 0;
  const currentSavings = estimatedSavings;
  const previousSavings = displayNumber(previousData?.estimated_savings);
  const savingsChange = previousClientAudit
    ? currentSavings - previousSavings
    : 0;

  const clients = workspace.hasBusinessAccess
    ? await prisma.client.findMany({
        where: {
          ownerId: workspace.owner.id,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      })
    : [];

  return (
    <>
      <div className="audit-report-shell">
        <div className="audit-report-header">
          <div>
            <div className="audit-eyebrow">Financial leakage audit</div>
            <h1 className="audit-report-title">Effluxa AI Financial Leak Audit</h1>
            <div className="audit-report-meta">
              <span>{report.fileUrl}</span>
              <span>{new Date(report.createdAt).toLocaleString()}</span>
              {report.client && <span>Client: {report.client.name}</span>}
            </div>
          </div>

          <div className="audit-report-actions">
            <span className={`audit-status-badge ${isUnlocked ? "is-unlocked" : "is-preview"}`}>
              {isUnlocked ? "Full audit" : "Preview"}
            </span>
            <DeleteReportButton reportId={report.id} />
          </div>
        </div>

        {workspace.hasBusinessAccess && (
          <>
            <ChangeReportClientForm
              reportId={report.id}
              currentClientId={report.clientId}
              clients={clients}
            />

            {report.internalNote && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "18px",
                  borderRadius: "16px",
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.18)",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: "10px" }}>
                  Saved Internal Note
                </div>

                <p className="gray" style={{ lineHeight: 1.7 }}>
                  {report.internalNote}
                </p>
              </div>
            )}

            <InternalNoteForm
              reportId={report.id}
              defaultNote={report.internalNote}
            />
          </>
        )}

        <div className="audit-summary-grid">
          <div className="audit-metric-card audit-metric-score">
            <span>Leakage score</span>
            <strong>{leakageScore}<small>/100</small></strong>
            <p>Higher scores indicate more leakage risk to review.</p>
          </div>
          <div className="audit-metric-card audit-metric-savings">
            <span>Estimated savings</span>
            <strong>{visibleSavings === null ? "Locked" : `€${visibleSavings.toLocaleString()}`}</strong>
            <p>{visibleSavings === null ? "Unlock the full audit to reveal the opportunity." : "Conservative opportunity identified in this file."}</p>
          </div>
          <div className="audit-metric-card">
            <span>Risk level</span>
            <strong>{visibleRiskLevel}</strong>
            <p>Confidence: {visibleConfidence}</p>
          </div>
          <div className="audit-metric-card">
            <span>Report access</span>
            <strong>{isUnlocked ? "Full" : "Preview"}</strong>
            <p>{isUnlocked ? "All available findings are visible." : "Unlock the full audit to continue."}</p>
          </div>
        </div>

        <div className="audit-card audit-summary-card">
          <div className="audit-section-kicker">Executive overview</div>
          <h2>What Effluxa found</h2>
          <p style={{ marginTop: "16px", lineHeight: 1.8 }}>
            {executiveSummary}
          </p>
        </div>

        {workspace.hasBusinessAccess && previousClientAudit && (
          <div className="audit-card" style={{ marginTop: "28px" }}>
            <h2>Audit Comparison</h2>

            <p className="gray" style={{ marginTop: "12px", lineHeight: 1.7 }}>
              Compared with previous audit for this client:
              {" "}
              <strong>{previousClientAudit.fileUrl}</strong>
            </p>

            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="gray">Previous Leakage</div>
                <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "8px" }}>
                  {previousLeakage}/100
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="gray">Current Leakage</div>
                <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "8px" }}>
                  {currentLeakage}/100
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="gray">Leakage Change</div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    marginTop: "8px",
                    color: leakageImprovement >= 0 ? "#4ade80" : "#f87171",
                  }}
                >
                  {leakageImprovement >= 0 ? "-" : "+"}
                  {Math.abs(leakagePointChange)} pts
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="gray">Savings Change</div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    marginTop: "8px",
                    color: savingsChange >= 0 ? "#4ade80" : "#f87171",
                  }}
                >
                  {savingsChange >= 0 ? "+" : "-"}€{Math.abs(savingsChange).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {isUnlocked ? (
          <>
            {isLimitedDataReport && (
              <div
                className="audit-card"
                style={{
                  marginTop: "28px",
                  border: "1px solid #facc15",
                  background: "#fefce8",
                }}
              >
                <h2>Limited-data report</h2>
                <p style={{ marginTop: "12px", color: "#713f12", lineHeight: 1.7 }}>
                  Effluxa generated a conservative fallback report because the uploaded document
                  or AI response could not support a complete structured audit.
                </p>
                {reportQualityReason && (
                  <p style={{ marginTop: "10px", color: "#713f12", lineHeight: 1.7 }}>
                    Reason: {reportQualityReason}
                  </p>
                )}
              </div>
            )}

            <div className="savings-card" style={{ marginTop: "28px" }}>
              <div className="audit-section-kicker">Commercial opportunity</div>
              <h2>Estimated Savings Opportunity</h2>
              <p className="savings-value">€{estimatedSavings.toLocaleString()}</p>
              <p style={{ marginTop: "12px", color: "#166534", lineHeight: 1.7 }}>
                Use this as a prioritisation signal, then validate the underlying transactions before taking action.
              </p>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Quick Wins</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {quickWins.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>High Cost Categories</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {highCostCategories.map((item: any, index: number) => (
                  <li key={index}>
                    {item.category} — €{item.amount || 0} — {item.reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Anomalies & Duplicate Payment Risks</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {anomalies.map((item, index) => (
                  <li key={`a-${index}`}>
                    <strong>{item.item}</strong>{item.reason ? ` — ${item.reason}` : ""}
                  </li>
                ))}
                {duplicatePaymentRisks.map((item, index) => (
                  <li key={`d-${index}`}>
                    <strong>{item.item}</strong>{item.reason ? ` — ${item.reason}` : ""}
                  </li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Cash Flow Observations</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {cashflowObservations.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>CFO Summary</h2>
              <p style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {cfoSummary}
              </p>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Key Findings</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {keyFindings.map(
                  (item: string, index: number) => (
                    <li key={index}>{item}</li>
                  )
                )}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Top Vendors</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {topVendors.map((vendor: any, index: number) => (
                  <li key={index}>
                    {vendor.vendor} — €{vendor.amount}
                  </li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>AI Recommendations</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {recommendations.map(
                  (item: string, index: number) => (
                    <li key={index}>{item}</li>
                  )
                )}
              </ul>
            </div>

            <div style={{ marginTop: "28px" }}>
              <a href={`/api/reports/${report.id}/download`}>
                <button className="primary-button">
                  Download Full Audit PDF
                </button>
              </a>

              <ShareReportButton reportId={report.id} />
            </div>
          </>
        ) : (
          <div
            style={{
              marginTop: "40px",
              padding: "32px",
              borderRadius: "22px",
              background: "#fff3f3",
              border: "1px solid #ffd0d0",
              color: "#0f172a",
            }}
          >
            <h2>Unlock Full AI Audit</h2>

            <p style={{ marginTop: "12px", color: "#334155", lineHeight: 1.7 }}>
              Unlock estimated savings, vendor insights, leakage analysis, and full AI recommendations.
            </p>

            <div
              style={{
                marginTop: "24px",
                padding: "22px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ fontSize: "20px", marginBottom: "14px" }}>
                What You Unlock With Full Audit
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  color: "#334155",
                  lineHeight: 1.7,
                  fontSize: "15px",
                }}
              >
                <div>✓ Full AI financial leak audit</div>
                <div>✓ Estimated savings opportunity analysis</div>
                <div>✓ Vendor and spend breakdown</div>
                <div>✓ Executive summary</div>
                <div>✓ AI-generated recommendations</div>
                <div>✓ Downloadable PDF report</div>
              </div>

              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "18px",
                  borderTop: "1px solid #e2e8f0",
                  color: "#64748b",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                One-time payment or included with Effluxa Pro and Agency. Effluxa provides AI-generated informational analysis and not financial, tax, legal, or investment advice.
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <UpgradeButton reportId={report.id} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
