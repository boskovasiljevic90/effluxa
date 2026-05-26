import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import UpgradeButton from "./UpgradeButton";

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

  let report = await prisma.upload.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!report) {
    return <div style={{ padding: "40px" }}>Report not found.</div>;
  }

  if (!report.unlocked && searchParams?.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-02-25.clover",
      });

      const session = await stripe.checkout.sessions.retrieve(
        searchParams.session_id
      );

      const paid =
        session.payment_status === "paid" ||
        session.status === "complete";

      const sessionReportId = session.metadata?.reportId;
      const sessionUserId = session.metadata?.userId;

      if (paid && sessionReportId === report.id && sessionUserId === user.id) {
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
            id: params.id,
            userId: user.id,
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
  const isUnlocked = report.unlocked;

  return (
    <div className="page-container">
      <div style={{ padding: "40px", maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "18px" }}>
          Effluxa AI Financial Leak Audit
        </h1>

        <p>
          <strong>File:</strong> {report.fileUrl}
        </p>

        <p>
          <strong>Date:</strong> {new Date(report.createdAt).toLocaleString()}
        </p>

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
            <p style={{ marginTop: "12px", color: "#334155" }}>
              Unlock estimated savings, vendor insights, leakage analysis, and full AI recommendations.
            </p>
            <UpgradeButton reportId={report.id} />
          </div>
        )}
      </div>
    </div>
  );
}
