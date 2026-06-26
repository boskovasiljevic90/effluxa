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
          }}>
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

      <section style={{ background: "white", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
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
            applicationCategory: "BusinessApplication",
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
                price: "29",
                priceCurrency: "EUR",
                name: "Full AI Audit",
              },
              {
                "@type": "Offer",
                price: "44.99",
                priceCurrency: "EUR",
                name: "Business Plan",
              },
            ],
          }),
        }}
      />

      <section id="pricing" style={{ maxWidth: "1100px", margin: "0 auto", padding: "90px 24px" }}>
        <h2 style={{ fontSize: "48px", fontWeight: 950, letterSpacing: "-2px", textAlign: "center" }}>
          Simple pricing for audits and teams
        </h2>

        <div style={{
          marginTop: "50px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "26px",
        }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "28px", padding: "36px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Free Preview</h3>
            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>€0</div>
            <p style={{ color: "#64748b", lineHeight: 1.7 }}>Upload and preview AI audit insights.</p>
            <ul style={{ marginTop: "24px", lineHeight: 2, color: "#334155" }}>
              <li>✓ 3 free audit previews</li>
              <li>✓ Leakage score</li>
              <li>✓ Executive summary</li>
              <li>✓ PDF / CSV / XLSX support</li>
            </ul>
          </div>

          <div style={{ background: "#0f172a", color: "white", borderRadius: "28px", padding: "36px", boxShadow: "0 20px 55px rgba(15,23,42,0.25)" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Full AI Audit</h3>
            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>€29</div>
            <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>One-time unlock for a complete report.</p>
            <ul style={{ marginTop: "24px", lineHeight: 2, color: "#e2e8f0" }}>
              <li>✓ Full recommendations</li>
              <li>✓ Vendor analysis</li>
              <li>✓ Savings estimate</li>
              <li>✓ Downloadable PDF</li>
            </ul>
          </div>

          <div style={{ background: "white", border: "2px solid #0f172a", borderRadius: "28px", padding: "36px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: 900 }}>Business</h3>
            <div style={{ marginTop: "16px", fontSize: "52px", fontWeight: 950 }}>€44.99</div>
            <p style={{ color: "#64748b", lineHeight: 1.7 }}>For teams, consultants and client portfolios.</p>
            <ul style={{ marginTop: "24px", lineHeight: 2, color: "#334155" }}>
              <li>✓ Unlimited AI audits</li>
              <li>✓ Client dashboards</li>
              <li>✓ Portfolio intelligence</li>
              <li>✓ Team workspace</li>
              <li>✓ Executive PDF / CSV exports</li>
            </ul>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "54px" }}>
          <Link href="/signup">
            <button style={{
              height: "64px",
              padding: "0 40px",
              borderRadius: "20px",
              border: "none",
              background: "#0f172a",
              color: "white",
              fontSize: "19px",
              fontWeight: 950,
              cursor: "pointer",
            }}>
              Start Your First Audit
            </button>
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px 90px" }}>
        <h2 style={{ fontSize: "42px", fontWeight: 950, textAlign: "center", letterSpacing: "-1.5px" }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: "grid", gap: "18px", marginTop: "42px" }}>
          {[
            [
              "Is Effluxa financial advice?",
              "No. Effluxa provides AI-generated informational analysis only. It is not financial, legal, tax, accounting or investment advice."
            ],
            [
              "What files can I upload?",
              "Effluxa supports PDF, CSV, XLSX and XLS files such as invoices, statements, accounting exports and expense reports."
            ],
            [
              "Who is Effluxa for?",
              "Effluxa is built for SMEs, CFOs, accountants, consultants and agencies that want to detect financial leakage and savings opportunities."
            ],
            [
              "Do I need accounting software integration?",
              "No. Effluxa works with direct file uploads, so you can start without complex setup or integrations."
            ],
            [
              "What is included in Business?",
              "Business includes unlimited AI audits, client dashboards, team workspace, portfolio intelligence, executive exports and monthly summaries."
            ],
          ].map(([question, answer]) => (
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
