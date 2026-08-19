import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Effluxa | AI Financial Leak Detection for SMEs",
  description:
    "Effluxa helps SMEs, CFOs and consultants detect financial leakage, overspending, duplicate payment risks, vendor concentration and hidden savings opportunities using AI.",
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
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 90px" }}>
        <PublicHeader />

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
            Find financial leakage before it becomes profit loss.
          </h1>

          <p style={{
            marginTop: "30px",
            fontSize: "23px",
            lineHeight: 1.6,
            color: "#334155",
            maxWidth: "820px",
          }}>
            Effluxa analyzes invoices, statements, CSV exports and Excel files to detect overspending,
            duplicate payment risks, vendor concentration, cash flow pressure and hidden savings opportunities.
          </p>

          <div style={{ marginTop: "42px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link href="/signup">
              <button style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
              }}>
                Start Free Audit
              </button>
            </Link>

            <Link href="/sample-audit">
              <button style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#0f172a",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
              }}>
                View Sample Audit
              </button>
            </Link>

            <a href="#pricing">
              <button style={{
                height: "62px",
                padding: "0 34px",
                borderRadius: "18px",
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#0f172a",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
              }}>
                View Pricing
              </button>
            </a>
          </div>

        </div>

        <div style={{
          marginTop: "70px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: "20px",
        }}>
          {[
            ["Leakage Score", "78/100", "Financial inefficiency risk"],
            ["Savings Found", "€18,420", "Potential optimization"],
            ["Client Portfolio", "12 clients", "Agency-ready tracking"],
            ["Executive Reports", "PDF + CSV", "Exportable intelligence"],
          ].map(([title, value, desc]) => (
            <div key={title} style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 12px 35px rgba(15,23,42,0.06)",
            }}>
              <div style={{ color: "#64748b", fontWeight: 800 }}>{title}</div>
              <div style={{ marginTop: "14px", fontSize: "40px", fontWeight: 950 }}>{value}</div>
              <div style={{ marginTop: "10px", color: "#475569", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ background: "white", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
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
              <div key={title} style={{ border: "1px solid #e2e8f0", borderRadius: "24px", padding: "32px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  background: "#0f172a",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 950,
                }}>
                  {i + 1}
                </div>
                <h3 style={{ marginTop: "22px", fontSize: "24px", fontWeight: 900 }}>{title}</h3>
                <p style={{ marginTop: "12px", color: "#475569", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
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
                price: "99",
                priceCurrency: "EUR",
                name: "Full AI Audit",
              },
              {
                "@type": "Offer",
                price: "79",
                priceCurrency: "EUR",
                name: "Pro Plan",
              },
            ],
          }),
        }}
      />

      <section id="pricing" style={{ maxWidth: "1100px", margin: "0 auto", padding: "90px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">Pricing</div>

          <h2 style={{ fontSize: "42px", lineHeight: 1.1, marginTop: "14px" }}>
            Simple pricing for audits, professionals and agencies
          </h2>

          <p className="gray" style={{ marginTop: "16px", fontSize: "18px" }}>
            Start with a free preview, unlock one full audit, or upgrade to Pro or Agency.
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
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              padding: "30px",
            }}
          >
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Full AI Audit</h3>

            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>
              €99
            </div>

            <p className="gray" style={{ marginTop: "12px" }}>
              One-time complete AI financial leakage analysis.
            </p>

            <ul style={{ marginTop: "22px", lineHeight: 1.9 }}>
              <li>✓ Full AI audit report</li>
              <li>✓ Savings opportunities</li>
              <li>✓ Executive recommendations</li>
              <li>✓ No subscription required</li>
            </ul>

            <a href="/signup">
              <button className="primary-button" style={{ marginTop: "24px", width: "100%" }}>
                Start Free Preview
              </button>
            </a>
          </div>

          <div
            style={{
              background: "white",
              border: "2px solid #111827",
              borderRadius: "24px",
              padding: "30px",
              boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
            }}
          >
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Pro</h3>

            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>
              €79
            </div>

            <p className="gray" style={{ marginTop: "4px" }}>
              per month · €790/year
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

            <a href="/signup">
              <button className="primary-button" style={{ marginTop: "24px", width: "100%" }}>
                Start Pro
              </button>
            </a>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "24px",
              padding: "30px",
            }}
          >
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Agency</h3>

            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>
              €299
            </div>

            <p className="gray" style={{ marginTop: "4px" }}>
              per month · €2,990/year
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

            <a href="/signup">
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
            <div key={question} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "28px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 900 }}>{question}</h3>
              <p style={{ marginTop: "12px", color: "#475569", lineHeight: 1.7 }}>{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
