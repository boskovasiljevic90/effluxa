import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ReferralExperience from "@/components/ReferralExperience";

export const metadata: Metadata = {
  title: "Effluxa | Find duplicate payments, vendor overcharging and wasted spend",
  description:
    "Effluxa checks your invoice ledger, payment run or management pack and returns a ranked, evidence-linked leakage report: duplicate payments, vendor overcharging, wasted software spend and cash-flow pressure. No integration required.",
  alternates: {
    canonical: "https://www.effluxa.com",
  },
  openGraph: {
    title: "Effluxa | AI Financial Leak Detection",
    description:
      "Upload financial files and get AI-powered leakage scores, savings opportunities, client dashboards and executive reports.",
    url: "https://www.effluxa.com",
    siteName: "Effluxa",
    type: "website",
  },
};

const faqItems: Array<[string, string]> = [
  [
    "Is Effluxa financial advice?",
    "No. Effluxa provides AI-generated informational analysis only. It is not financial, legal, tax, accounting or investment advice.",
  ],
  [
    "What files can I upload?",
    "Effluxa supports PDF, CSV, XLSX and XLS files such as invoices, statements, accounting exports and expense reports.",
  ],
  [
    "Who is Effluxa for?",
    "Effluxa is built for SMEs, CFOs, accountants, consultants and agencies that want to detect financial leakage and savings opportunities.",
  ],
  [
    "Do I need accounting software integration?",
    "No. Effluxa works with direct file uploads, so you can start without complex setup or integrations.",
  ],
  [
    "What is included in Agency?",
    "Agency includes unlimited AI audits, client dashboards, team workspace, portfolio intelligence, executive exports and monthly summaries.",
  ],
  [
    "How long are uploaded files kept?",
    "Effluxa keeps generated report data while your account is active so you can review your audit history. You can delete individual reports or permanently delete the account from Account Settings.",
  ],
  [
    "How quickly do I get a report?",
    "Most supported uploads are analyzed within minutes. Processing time can vary with file size, format and AI service availability.",
  ],
  [
    "How accurate is the AI analysis?",
    "The analysis is a screening and decision-support tool. Results depend on the quality and completeness of the uploaded data, so important findings should be verified before action.",
  ],
  [
    "How is Effluxa different from bookkeeping software?",
    "Effluxa identifies leakage patterns, anomalies and savings opportunities. It does not replace bookkeeping, account reconciliation, tax filing or payment approval workflows.",
  ],
  [
    "Can I request a refund?",
    "If a paid audit was not generated or the service was materially unavailable, contact support@effluxa.com with your account and report details. Subscription cancellations stop future renewals; refund requests are reviewed based on the situation and applicable consumer rules.",
  ],
];

export default function HomePage() {
  return (
    <main className="public-dark-page" style={{ minHeight: "100vh", background: "#0b1020", color: "#f8fafc" }}>
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 90px" }}>
        <PublicHeader />

        <ReferralExperience />

        <div style={{ marginTop: "70px", maxWidth: "980px" }}>
          <div style={{
            display: "inline-flex",
            padding: "10px 18px",
            borderRadius: "999px",
            background: "#ecfeff",
            color: "#155e75",
            fontWeight: 800,
            border: "1px solid #a5f3fc",
          }}>
            AI Financial Intelligence for SMEs, CFOs & Consultants
          </div>

          <h1 style={{
            marginTop: "28px",
            fontSize: "76px",
            lineHeight: 0.95,
            letterSpacing: "-4px",
            fontWeight: 950,
          }} className="landing-hero-title">
            Find the money leaking out of your business.
          </h1>

          <p style={{
            marginTop: "30px",
            fontSize: "23px",
            lineHeight: 1.6,
            color: "#e2e8f0",
            maxWidth: "820px",
          }}>
            Upload an invoice ledger, payment run, bank statement or management pack. Effluxa ranks duplicate
            payments, vendor overcharging, wasted software spend, vendor concentration and cash-flow pressure —
            each with source evidence and a confidence level.
          </p>

          <div style={{ marginTop: "42px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link href="/instant">
              <button style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
              }}>
                Check a file free — no account
              </button>
            </Link>

            <Link href="/signup">
              <button style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "1px solid rgba(148,163,184,0.28)",
                background: "rgba(255,255,255,0.055)",
                color: "#f8fafc",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
              }}>
                Create a free account
              </button>
            </Link>

            <a href="#pricing">
              <button style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "1px solid rgba(148,163,184,0.28)",
                background: "rgba(255,255,255,0.055)",
                color: "#f8fafc",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
              }}>
                View Pricing
              </button>
            </a>
          </div>

        </div>

        <div className="home-facts">
          {[
            ["Control rules", "32", "Duplicate payments, price creep, cash, payroll, tax and more"],
            ["File-first", "No setup", "PDF, CSV, XLSX or XLS exactly as you already have it"],
            ["Evidence-linked", "Per finding", "Source page or row, confidence and calculation basis"],
            ["Recurring", "Monthly", "What is new, recurring or no longer detected"],
          ].map(([title, value, desc]) => (
            <div key={title} className="home-fact">
              <div className="home-fact-title">{title}</div>
              <div className="home-fact-value">{value}</div>
              <div className="home-fact-desc">{desc}</div>
            </div>
          ))}
        </div>

        <p className="home-facts-note">
          Every finding is a review signal, not a confirmed loss. Effluxa does not guarantee savings.
        </p>
      </section>

      <section id="how-it-works" style={{ background: "rgba(255,255,255,0.035)", borderTop: "1px solid rgba(148,163,184,0.2)", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "90px 24px" }}>
          <h2 style={{ fontSize: "48px", fontWeight: 950, letterSpacing: "-2px", textAlign: "center" }}>
            Built for recurring financial intelligence
          </h2>

          <div style={{
            marginTop: "55px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "24px",
          }}>
            {[
              ["Upload financial files", "PDF invoices, CSV exports, XLSX statements and expense reports."],
              ["AI detects leakage", "Find overspending, duplicate payment risks, vendor concentration and anomalies."],
              ["Track clients", "Assign audits to clients and monitor savings, risk and leakage trends."],
              ["Export executive reports", "Download branded PDFs, CSVs and share client portfolios with stakeholders."],
            ].map(([title, desc], i) => (
              <div key={title} style={{ border: "1px solid rgba(148,163,184,0.2)", borderRadius: "24px", padding: "32px", background: "rgba(255,255,255,0.055)" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  background: "#111a35",
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 950,
                }}>
                  {i + 1}
                </div>
                <h3 style={{ marginTop: "22px", fontSize: "24px", fontWeight: 900 }}>{title}</h3>
                <p style={{ marginTop: "12px", color: "#e2e8f0", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.18))", borderTop: "1px solid rgba(129,140,248,0.36)", borderBottom: "1px solid rgba(129,140,248,0.36)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "74px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "36px", alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ color: "#c7d2fe" }}>For accounting &amp; finance firms</div>
              <h2 style={{ marginTop: "14px", fontSize: "42px", lineHeight: 1.08, letterSpacing: "-1.5px", fontWeight: 950 }}>
                One partner workflow. More useful client conversations.
              </h2>
              <p style={{ marginTop: "16px", maxWidth: "720px", color: "#e2e8f0", lineHeight: 1.75, fontSize: "18px" }}>
                Start with one client-approved, redacted file. Effluxa gives your team a repeatable leakage screening workflow, source evidence and follow-up context without waiting for an integration project.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link href="/for-accounting-firms?utm_source=homepage&utm_medium=owned&utm_campaign=partner_channel&utm_content=hero_partner">
                <button className="primary-button" style={{ width: "100%", padding: "16px 20px" }}>
                  Explore the partner workflow
                </button>
              </Link>
              <Link href="/signup?plan=agency_monthly&utm_source=homepage&utm_medium=owned&utm_campaign=partner_channel&utm_content=self_serve_agency">
                <button className="primary-button" style={{ width: "100%", padding: "16px 20px", background: "rgba(255,255,255,0.055)", color: "#f8fafc", border: "1px solid rgba(148,163,184,0.28)" }}>
                  Start self-serve — no call needed
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Effluxa",
            applicationCategory: "AgencyApplication",
            operatingSystem: "Web",
            description:
              "AI financial leak detection platform for SMEs, CFOs and consultants.",
            offers: [
              {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
                name: "Free Preview",
              },
              {
                "@type": "Offer",
                price: "149",
                priceCurrency: "EUR",
                name: "Full AI Audit",
              },
              {
                "@type": "Offer",
                price: "99",
                priceCurrency: "EUR",
                name: "Pro Plan",
              },
              {
                "@type": "Offer",
                price: "399",
                priceCurrency: "EUR",
                name: "Agency Plan",
              },
            ],
          }),
        }}
      />

      <section id="pricing" style={{ maxWidth: "1100px", margin: "0 auto", padding: "90px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">Pricing</div>

          <h2 style={{ fontSize: "42px", lineHeight: 1.1, marginTop: "14px" }}>
            Pay for the audit, not for a consultant
          </h2>

          <p className="gray" style={{ marginTop: "16px", fontSize: "18px" }}>
            Start with a free check on your own file. Unlock the full audit when the evidence is worth it. Move to Pro or Agency when you want it every month.
          </p>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "22px",
            marginTop: "44px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.055)",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "24px",
              padding: "30px",
            }}
          >
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Full AI Audit</h3>

            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>
              €149
            </div>

            <p className="gray" style={{ marginTop: "12px" }}>
              One-time complete audit of one financial pack.
            </p>

            <ul style={{ marginTop: "22px", lineHeight: 1.9 }}>
              <li>✓ Full AI audit report</li>
              <li>✓ Savings opportunities</li>
              <li>✓ Executive recommendations</li>
              <li>✓ No subscription required</li>
            </ul>

            <a href="/instant?utm_source=pricing&utm_medium=owned&utm_campaign=plans&utm_content=full_audit">
              <button className="primary-button" style={{ marginTop: "24px", width: "100%" }}>
                Check a file free first
              </button>
            </a>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "2px solid rgba(129,140,248,0.55)",
              borderRadius: "24px",
              padding: "30px",
              boxShadow: "0 24px 60px rgba(2,6,23,0.28)",
            }}
          >
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Pro</h3>

            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>
              €99
            </div>

            <p className="gray" style={{ marginTop: "4px" }}>
              per month · €990/year
            </p>

            <p className="gray" style={{ marginTop: "12px" }}>
              For professionals managing their own business finances.
            </p>

            <ul style={{ marginTop: "22px", lineHeight: 1.9 }}>
              <li>✓ Unlimited personal audits</li>
              <li>✓ Full report access</li>
              <li>✓ Download and share reports</li>
              <li>✓ Priority processing</li>
            </ul>

            <a href="/signup?plan=pro_monthly&utm_source=pricing&utm_medium=owned&utm_campaign=plans&utm_content=pro_monthly">
              <button className="primary-button" style={{ marginTop: "24px", width: "100%" }}>
                Start Pro
              </button>
            </a>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.055)",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "24px",
              padding: "30px",
            }}
          >
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Agency</h3>

            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>
              €399
            </div>

            <p className="gray" style={{ marginTop: "4px" }}>
              per month · €3,990/year
            </p>

            <p className="gray" style={{ marginTop: "12px" }}>
              For consultants, accountants, agencies and finance teams.
            </p>

            <ul style={{ marginTop: "22px", lineHeight: 1.9 }}>
              <li>✓ Everything in Pro</li>
              <li>✓ Client workspaces</li>
              <li>✓ Team seats</li>
              <li>✓ Portfolio intelligence</li>
            </ul>

            <a href="/signup?plan=agency_monthly&utm_source=pricing&utm_medium=owned&utm_campaign=plans&utm_content=agency_monthly">
              <button className="primary-button" style={{ marginTop: "24px", width: "100%" }}>
                Start Agency
              </button>
            </a>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map(([name, text]) => ({
              "@type": "Question",
              name,
              acceptedAnswer: {
                "@type": "Answer",
                text,
              },
            })),
          }),
        }}
      />

      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px 90px" }}>
        <h2 style={{ fontSize: "42px", fontWeight: 950, textAlign: "center", letterSpacing: "-1.5px" }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: "grid", gap: "18px", marginTop: "42px" }}>
          {faqItems.map(([question, answer]) => (
            <div key={question} style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "22px", padding: "28px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 900 }}>{question}</h3>
              <p style={{ marginTop: "12px", color: "#e2e8f0", lineHeight: 1.7 }}>{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
