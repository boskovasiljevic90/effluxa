import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Sample AI Financial Audit | Effluxa",
  description:
    "View a sample Effluxa AI financial audit showing leakage score, risk level, savings opportunities, key findings and recommendations.",
  alternates: {
    canonical: "https://www.effluxa.com/sample-audit",
  },
  openGraph: {
    title: "Sample AI Financial Audit | Effluxa",
    description:
      "See what Effluxa detects from invoices, statements, CSV exports and Excel files before creating an account.",
    url: "https://www.effluxa.com/sample-audit",
    siteName: "Effluxa",
    type: "article",
  },
};

export default function SampleAuditPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 90px" }}>
        <PublicHeader />

        <h1 style={{ fontSize: "54px", marginTop: "60px", fontWeight: 950 }}>
          Sample Effluxa AI Audit
        </h1>

        <p style={{ marginTop: "16px", color: "#475569", fontSize: "20px", lineHeight: 1.7 }}>
          See what Effluxa can detect from financial files before creating an account.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "18px", marginTop: "36px" }}>
          {[
            ["Leakage Score", "78/100"],
            ["Risk Level", "High"],
            ["Potential Savings", "€18,420"],
            ["Confidence", "Medium"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "26px" }}>
              <div style={{ color: "#64748b", fontWeight: 800 }}>{label}</div>
              <div style={{ marginTop: "12px", fontSize: "36px", fontWeight: 950 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "32px", marginTop: "28px" }}>
          <h2>Executive Summary</h2>
          <p style={{ color: "#475569", lineHeight: 1.8, marginTop: "14px" }}>
            Effluxa detected several financial leakage patterns including vendor concentration,
            recurring software overspend, potential duplicate payment exposure and weak spend visibility.
            The strongest savings opportunity is vendor consolidation and subscription review.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "22px", marginTop: "28px" }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "28px" }}>
            <h2>Key Findings</h2>
            <ul style={{ color: "#475569", lineHeight: 2 }}>
              <li>High vendor concentration in software tools</li>
              <li>Potential duplicate payment risk across invoice batches</li>
              <li>Recurring subscriptions without clear owner</li>
              <li>Cash flow pressure from short payment terms</li>
            </ul>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "28px" }}>
            <h2>Recommended Actions</h2>
            <ul style={{ color: "#475569", lineHeight: 2 }}>
              <li>Review top 10 vendors by spend</li>
              <li>Consolidate overlapping subscriptions</li>
              <li>Flag duplicate invoices before payment</li>
              <li>Negotiate longer payment terms with key vendors</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: "42px" }}>
          <Link href="/signup">
            <button style={{ height: "62px", padding: "0 34px", borderRadius: "18px", border: "none", background: "#0f172a", color: "white", fontSize: "18px", fontWeight: 950 }}>
              Start Your Own Free Audit
            </button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
