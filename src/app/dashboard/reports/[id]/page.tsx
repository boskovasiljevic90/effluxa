export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import UpgradeButton from "./UpgradeButton";
import DeleteReportButton from "./DeleteReportButton";
import ShareReportButton from "./ShareReportButton";
import { getWorkspaceOwner } from "@/lib/workspace";

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
  searchParams?: {
    session_id?: string;
  };
}

export default async function ReportPage({ params, searchParams }: Props) {
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

  if (!report.unlocked && searchParams?.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);

      const paid =
        session.payment_status === "paid" ||
        session.status === "complete";

      if (
        paid &&
        session.metadata?.reportId === report.id &&
        session.metadata?.userId === user.id
      ) {
        await prisma.upload.update({
          where: { id: report.id },
          data: {
            unlocked: true,
            unlockedAt: new Date(),
            checkoutSessionId: session.id,
          },
        });

        report = await prisma.upload.findFirst({
          where: {
            id: reportId,
            userId: workspace.owner.id,
          },
          include: {
            client: true,
          },
        });
      }
    } catch (error) {
      console.error("STRIPE SESSION VERIFY ERROR:", error);
    }
  }

  if (!report) {
    return <div style={{ padding: "40px" }}>Report not found.</div>;
  }

  const data = report.parsedData as any;
  const isUnlocked = report.unlocked || workspace.hasBusinessAccess;

  return (
    <>
      <div style={{ maxWidth: "1100px" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "18px" }}>
          Effluxa AI Financial Leak Audit
        </h1>

        <p>
          <strong>File:</strong> {report.fileUrl}
        </p>

        <p>
          <strong>Date:</strong> {new Date(report.createdAt).toLocaleString()}
        </p>

        {report.client && (
          <p>
            <strong>Client:</strong> {report.client.name}
          </p>
        )}

        <DeleteReportButton reportId={report.id} />

        <div className="audit-card" style={{ marginTop: "36px" }}>
          <h2>Preview Summary</h2>
          <p style={{ marginTop: "16px", lineHeight: 1.7 }}>
            {data?.executive_summary ||
              data?.summary ||
              "Effluxa detected financial optimization opportunities in this document."}
          </p>
        </div>

        <div className="audit-card" style={{ marginTop: "28px" }}>
          <h2>Leakage Score</h2>
          <p style={{ fontSize: "42px", fontWeight: 800, marginTop: "18px" }}>
            {data?.leakage_score ?? 0}/100
          </p>
        </div>

        {isUnlocked ? (
          <>
            <div className="savings-card" style={{ marginTop: "28px" }}>
              <h2>Estimated Savings Opportunity</h2>
              <p className="savings-value">
                €{data?.estimated_savings?.toLocaleString?.() || "N/A"}
              </p>
            </div>


            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Risk Level</h2>
              <p style={{ fontSize: "32px", fontWeight: 800, marginTop: "18px" }}>
                {data?.risk_level || "Insufficient data"}
              </p>
              <p className="gray" style={{ marginTop: "10px" }}>
                Confidence: {data?.confidence_level || "Insufficient data"}
              </p>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Quick Wins</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {(data?.quick_wins || []).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>High Cost Categories</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {(data?.high_cost_categories || []).map((item: any, index: number) => (
                  <li key={index}>
                    {item.category} — €{item.amount || 0} — {item.observation}
                  </li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Anomalies & Duplicate Payment Risks</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {(data?.anomalies || []).map((item: any, index: number) => (
                  <li key={`a-${index}`}>{item.item} — {item.reason}</li>
                ))}
                {(data?.duplicate_payment_risks || []).map((item: any, index: number) => (
                  <li key={`d-${index}`}>{item.item} — {item.reason}</li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Cash Flow Observations</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {(data?.cashflow_observations || []).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>CFO Summary</h2>
              <p style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {data?.cfo_summary || "Insufficient data"}
              </p>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Key Findings</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {(data?.key_findings || data?.recommendations || []).map(
                  (item: string, index: number) => (
                    <li key={index}>{item}</li>
                  )
                )}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>Top Vendors</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {(data?.top_vendors || []).map((vendor: any, index: number) => (
                  <li key={index}>
                    {vendor.vendor} — €{vendor.amount}
                  </li>
                ))}
              </ul>
            </div>

            <div className="audit-card" style={{ marginTop: "28px" }}>
              <h2>AI Recommendations</h2>
              <ul style={{ marginTop: "16px", lineHeight: 1.8 }}>
                {(data?.recommendations || []).map(
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
                What You Unlock For €29
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
                One-time payment. No subscription. Effluxa provides AI-generated informational analysis and not financial, tax, legal, or investment advice.
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
