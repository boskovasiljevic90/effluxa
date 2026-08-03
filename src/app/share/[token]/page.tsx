export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import {
  asCategoryItems,
  asRiskItems,
  asTextArray,
  asVendorItems,
  getReportQualityReason,
  isFallbackReport,
} from "@/lib/reportDisplay";
import Link from "next/link";

type ReportData = Record<string, unknown>;

function getReportData(value: unknown): ReportData {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as ReportData;
  }

  return {};
}

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function formatAmount(value: unknown) {
  return getNumber(value).toLocaleString();
}

export default async function SharedReportPage({
  params,
}: {
  params: { token: string };
}) {
  const report = await prisma.upload.findUnique({
    where: {
      shareToken: params.token,
    },
    include: {
      client: true,
    },
  });

  if (!report) {
    return (
      <div style={{ padding: "60px", fontFamily: "Arial" }}>
        <h1>Shared report not found</h1>
        <p>This link may be invalid or no longer available.</p>
      </div>
    );
  }

  const data = getReportData(report.parsedData);
  const isLimitedDataReport = isFallbackReport(data);
  const reportQualityReason = getReportQualityReason(data);

  const quickWins = asTextArray(data.quick_wins, [
    "No quick wins were detected in the uploaded data.",
  ]);
  const highCostCategories = asCategoryItems(data.high_cost_categories, [
    {
      category: "No high-cost category detected",
      amount: 0,
      reason: "The uploaded data did not contain enough category detail.",
    },
  ]);
  const duplicatePaymentRisks = asRiskItems(data.duplicate_payment_risks, [
    {
      item: "No duplicate payment risk confirmed",
      reason: "The uploaded data did not contain enough detail to confirm duplicate payments.",
    },
  ]);
  const cashflowObservations = asTextArray(data.cashflow_observations, [
    "Cash flow patterns could not be reliably assessed from the uploaded data.",
  ]);
  const keyFindings = asTextArray(
    data.key_findings,
    asTextArray(data.recommendations, [
      "No key findings were generated from the uploaded data.",
    ])
  );
  const topVendors = asVendorItems(data.top_vendors, [
    {
      vendor: "No vendor data available",
      amount: 0,
      reason: "The uploaded data did not contain reliable vendor-level detail.",
    },
  ]);
  const recommendations = asTextArray(data.recommendations, [
    "No AI recommendations were generated from the uploaded data.",
  ]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ marginBottom: "36px" }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: "26px" }}>
            Eff<span style={{ color: "#2563eb" }}>luxa</span>
          </Link>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "28px",
            padding: "36px",
            boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
          }}
        >
          <h1 style={{ fontSize: "42px", fontWeight: 900 }}>
            Shared AI Financial Leak Audit
          </h1>

          <p style={{ marginTop: "12px", color: "#64748b" }}>
            File: {report.fileUrl}
          </p>

          <p style={{ marginTop: "6px", color: "#64748b" }}>
            Date: {new Date(report.createdAt).toLocaleString()}
          </p>

          {report.client && (
            <p style={{ marginTop: "6px", color: "#64748b" }}>
              Client: {report.client.name}
            </p>
          )}

          {isLimitedDataReport && (
            <section
              style={{
                marginTop: "28px",
                padding: "18px 20px",
                border: "1px solid #facc15",
                borderRadius: "16px",
                background: "#fefce8",
              }}
            >
              <h2 style={{ color: "#713f12" }}>Limited-data report</h2>
              <p style={{ marginTop: "10px", color: "#713f12", lineHeight: 1.7 }}>
                Effluxa generated a conservative fallback report because the uploaded document
                or AI response could not support a complete structured audit.
              </p>
              {reportQualityReason && (
                <p style={{ marginTop: "8px", color: "#713f12", lineHeight: 1.7 }}>
                  Quality note: {reportQualityReason}
                </p>
              )}
            </section>
          )}

          <section style={{ marginTop: "34px" }}>
            <h2>Executive Summary</h2>
            <p style={{ marginTop: "12px", lineHeight: 1.8 }}>
              {getText(
                data.executive_summary,
                "Effluxa detected financial optimization opportunities in this document."
              )}
            </p>
          </section>

          <section style={{ marginTop: "34px" }}>
            <h2>Leakage Score</h2>
            <div style={{ fontSize: "44px", fontWeight: 900, marginTop: "12px" }}>
              {getNumber(data.leakage_score)}/100
            </div>
          </section>

          <section style={{ marginTop: "34px" }}>
            <h2>Estimated Savings Opportunity</h2>
            <div
              style={{
                fontSize: "40px",
                fontWeight: 900,
                marginTop: "12px",
                color: "#16a34a",
              }}
            >
              €{formatAmount(data.estimated_savings)}
            </div>
          </section>

          <section style={{ marginTop: "34px" }}>
            <h2>Risk Level</h2>
            <p style={{ marginTop: "12px", lineHeight: 1.8 }}>
              {getText(data.risk_level, "Insufficient data")} — Confidence: {getText(
                data.confidence_level,
                "Insufficient data"
              )}
            </p>
          </section>

          <ReportListSection title="Quick Wins" items={quickWins} />

          <ReportListSection
            title="High Cost Categories"
            items={highCostCategories.map(
              (item) => `${item.category} — €${formatAmount(item.amount)} — ${item.reason}`
            )}
          />

          <ReportListSection
            title="Duplicate Payment Risks"
            items={duplicatePaymentRisks.map((item) => `${item.item} — ${item.reason}`)}
          />

          <ReportListSection title="Cash Flow Observations" items={cashflowObservations} />

          <section style={{ marginTop: "34px" }}>
            <h2>CFO Summary</h2>
            <p style={{ marginTop: "12px", lineHeight: 1.8 }}>
              {getText(data.cfo_summary, "Insufficient data")}
            </p>
          </section>

          <ReportListSection title="Key Findings" items={keyFindings} />

          <ReportListSection
            title="Top Vendors"
            items={topVendors.map(
              (item) => `${item.vendor} — €${formatAmount(item.amount)} — ${item.reason}`
            )}
          />

          <ReportListSection title="AI Recommendations" items={recommendations} />

          <div
            style={{
              marginTop: "40px",
              paddingTop: "24px",
              borderTop: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            This shared report is AI-generated by Effluxa and provided for informational purposes only.
            It is not financial, legal, accounting, tax, or investment advice.
          </div>
        </div>
      </div>
    </main>
  );
}

function ReportListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section style={{ marginTop: "34px" }}>
      <h2>{title}</h2>
      <ul style={{ marginTop: "12px", lineHeight: 1.9 }}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
