import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Financial Leakage Audits for Accounting Firms | Effluxa",
  description:
    "Give every accounting, bookkeeping or fractional-CFO client a repeatable, evidence-backed financial leakage audit without starting with a complex integration.",
  alternates: {
    canonical: "https://www.effluxa.com/for-accounting-firms",
  },
  openGraph: {
    title: "The financial leakage audit layer for accounting firms | Effluxa",
    description:
      "Upload client invoices, statements or exports, review evidence-backed leakage signals, assign follow-up and compare the next period.",
    url: "https://www.effluxa.com/for-accounting-firms",
    siteName: "Effluxa",
    type: "website",
  },
};

const faqs = [
  [
    "Does Effluxa replace accounting software?",
    "No. Effluxa is a financial-leakage screening and control-follow-up layer. It does not replace bookkeeping, reconciliation, tax filing or payment approval workflows.",
  ],
  [
    "What can a firm upload?",
    "PDF invoices and statements, CSV exports, XLSX workbooks and XLS expense or finance files. Start with a safe export that gives the audit enough context.",
  ],
  [
    "Does Effluxa promise guaranteed savings?",
    "No. Findings are review signals with evidence, confidence and a calculation basis. A recovered amount is only recorded when the client verifies an outcome.",
  ],
  [
    "Can I use it with multiple clients?",
    "Yes. Agency workspaces support client records, team collaboration, client-safe sharing, executive exports, control actions and recurring comparisons.",
  ],
  [
    "Do I need an integration before the first audit?",
    "No. Effluxa is file-first so a firm can validate the workflow using the data a client already has before requesting an integration.",
  ],
];

export default function AccountingFirmsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 90px" }}>
        <PublicHeader />

        <div style={{ maxWidth: "920px", marginTop: "72px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "10px 18px",
              borderRadius: "999px",
              background: "#eef2ff",
              color: "#3730a3",
              fontWeight: 850,
              border: "1px solid #c7d2fe",
            }}
          >
            For accounting, bookkeeping &amp; fractional-CFO firms
          </div>

          <h1
            style={{
              marginTop: "26px",
              fontSize: "68px",
              lineHeight: 0.98,
              letterSpacing: "-3px",
              fontWeight: 950,
            }}
            className="landing-hero-title"
          >
            Turn every client file into a repeatable leakage audit.
          </h1>

          <p style={{ marginTop: "28px", maxWidth: "800px", fontSize: "22px", lineHeight: 1.65, color: "#334155" }}>
            Effluxa gives finance professionals a fast first-pass over invoices, statements and exports — with source evidence, confidence, practical next actions and a way to compare the next period.
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "36px" }}>
            <Link href="/signup">
              <button className="primary-button" style={{ padding: "16px 24px", fontSize: "16px" }}>
                Start a free partner audit
              </button>
            </Link>
            <Link href="/sample-audit">
              <button
                className="primary-button"
                style={{ padding: "16px 24px", fontSize: "16px", background: "white", color: "#0f172a", border: "1px solid #cbd5e1" }}
              >
                View a sample audit
              </button>
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: "64px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "18px",
          }}
        >
          {[
            ["File-first", "Start with a client-approved PDF, CSV or spreadsheet instead of waiting for an integration project."],
            ["Evidence-backed", "Every structured finding can show its rule, confidence, calculation basis and source evidence."],
            ["Repeatable", "Save the client context, assign follow-up and compare the next reporting period."],
            ["Client-safe", "Share a controlled report or export an executive summary without exposing your internal notes."],
          ].map(([title, description]) => (
            <div key={title} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "26px", boxShadow: "0 12px 35px rgba(15,23,42,0.05)" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 900 }}>{title}</h2>
              <p style={{ marginTop: "12px", color: "#475569", lineHeight: 1.7 }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#0f172a", color: "white", borderTop: "1px solid #1e293b", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "86px 24px" }}>
          <div style={{ maxWidth: "780px" }}>
            <div className="eyebrow" style={{ color: "#a5b4fc" }}>A workflow your team can repeat</div>
            <h2 style={{ marginTop: "14px", fontSize: "48px", lineHeight: 1.05, letterSpacing: "-2px", fontWeight: 950 }}>
              From a one-off question to a monthly control conversation.
            </h2>
          </div>

          <div style={{ marginTop: "46px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "18px" }}>
            {[
              ["01", "Collect", "Ask the client for the file they already have: invoice batch, expense export, statement or vendor report."],
              ["02", "Screen", "Effluxa routes structured files through its fast audit path and keeps AI fallback for cases that need broader coverage."],
              ["03", "Review", "Inspect the finding, evidence, confidence and calculation basis before presenting it as a discussion point."],
              ["04", "Act", "Assign an owner, due date and outcome note, then compare the next period to see what changed."],
            ].map(([number, title, description]) => (
              <div key={number} style={{ padding: "24px", borderRadius: "20px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ color: "#a5b4fc", fontWeight: 900, fontSize: "14px" }}>{number}</div>
                <h3 style={{ marginTop: "16px", fontSize: "24px", fontWeight: 900 }}>{title}</h3>
                <p style={{ marginTop: "10px", color: "#cbd5e1", lineHeight: 1.7 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "90px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "42px", alignItems: "start" }}>
          <div>
            <div className="eyebrow">What Agency is for</div>
            <h2 style={{ marginTop: "14px", fontSize: "46px", lineHeight: 1.08, letterSpacing: "-2px", fontWeight: 950 }}>
              Standardise the first financial-leakage review across your portfolio.
            </h2>
            <p style={{ marginTop: "18px", color: "#475569", lineHeight: 1.8, fontSize: "18px" }}>
              Your firm keeps the professional judgment. Effluxa gives the team a consistent starting point, traceable evidence and a shared follow-up workflow so each client conversation does not begin from a blank spreadsheet.
            </p>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {[
              "Create a client workspace and keep audits grouped by client.",
              "Invite team members with a shared workflow instead of passing files through email.",
              "Generate a client-safe report or export an executive summary for the decision-maker.",
              "Track open controls and record verified outcomes separately from estimates.",
              "Return to the next reporting period and see recurring, new and no-longer-detected rule families.",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "18px 20px", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                <span style={{ color: "#16a34a", fontWeight: 950 }}>✓</span>
                <span style={{ color: "#334155", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "white", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "82px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <div className="eyebrow">Built for responsible review</div>
            <h2 style={{ marginTop: "14px", fontSize: "42px", fontWeight: 950 }}>Useful evidence, honest limits.</h2>
            <p style={{ margin: "16px auto 0", maxWidth: "720px", color: "#475569", lineHeight: 1.8, fontSize: "18px" }}>
              Effluxa does not call a possible exposure a confirmed loss. It does not turn an estimate into realised savings, and it does not replace the professional who validates the underlying document.
            </p>
          </div>

          <div style={{ marginTop: "36px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "16px" }}>
            {[
              ["Source context", "Page, row or source detail when the parser can provide it."],
              ["Confidence", "A signal about the quality and completeness of the input and finding."],
              ["Reviewer feedback", "Mark a finding supported, not supported or unclear."],
              ["Verified outcome", "Record recovered value only after a person confirms what happened."],
            ].map(([title, description]) => (
              <div key={title} style={{ padding: "22px", borderRadius: "18px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "19px", fontWeight: 900 }}>{title}</h3>
                <p style={{ marginTop: "9px", color: "#475569", lineHeight: 1.65 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "86px 24px" }}>
        <h2 style={{ fontSize: "42px", fontWeight: 950, textAlign: "center" }}>Questions finance firms usually ask</h2>
        <div style={{ marginTop: "34px", display: "grid", gap: "14px" }}>
          {faqs.map(([question, answer]) => (
            <details key={question} style={{ padding: "20px 22px", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 850 }}>{question}</summary>
              <p style={{ marginTop: "12px", color: "#475569", lineHeight: 1.7 }}>{answer}</p>
            </details>
          ))}
        </div>

        <div style={{ marginTop: "48px", padding: "30px", borderRadius: "24px", background: "#eef2ff", border: "1px solid #c7d2fe", textAlign: "center" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>Start with one client-approved file.</h2>
          <p style={{ marginTop: "10px", color: "#3730a3", lineHeight: 1.7 }}>
            Validate the workflow on real evidence before asking your team or client to change systems.
          </p>
          <Link href="/signup">
            <button className="primary-button" style={{ marginTop: "22px", padding: "15px 24px" }}>
              Create a free Effluxa account
            </button>
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(([question, answer]) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: {
                "@type": "Answer",
                text: answer,
              },
            })),
          }),
        }}
      />

      <PublicFooter />
    </main>
  );
}
