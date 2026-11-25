import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PartnerCalculator from "@/components/PartnerCalculator";
import { DISPLAY_PRICE, eur } from "@/lib/pricingDisplay";

export const metadata: Metadata = {
  title: "Partner programme for accounting and CFO firms | Effluxa",
  description:
    "Offer a client-file leakage review under your own brand. 25% recurring revenue share or wholesale pricing, self-serve, no calls and no minimum commitments.",
  alternates: { canonical: "https://www.effluxa.com/partners" },
};

const models = [
  {
    name: "Revenue share",
    price: "25% recurring, 12 months",
    body:
      "Send a client to Effluxa and earn 25% of their subscription for the first twelve months. Paid monthly by bank transfer. No minimum volume and no contract.",
    points: ["25% of Pro or Agency for 12 months", "Attribution by your referral link", "Monthly payout, no threshold"],
  },
  {
    name: "Wholesale",
    price: "€199 → rebill at €399+",
    body:
      "Buy Agency seats at wholesale and bill your client at your own rate. The margin is yours and the report carries your logo, not ours.",
    points: ["Agency wholesale from €199/month", "White-label PDF with the firm footer", "You own the client relationship"],
  },
  {
    name: "Client portfolio",
    price: "€399/month",
    body:
      "Run the review yourself across up to 100 client files per month, with a portfolio dashboard, period comparison and team access.",
    points: ["Up to 100 client files per month", "Portfolio view and period comparison", "Data-processing agreement available"],
  },
];

export default function PartnersPage() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 70px" }}>
        <PublicHeader />

        <div style={{ maxWidth: "800px", marginTop: "54px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "9px 16px",
              borderRadius: "999px",
              background: "rgba(37,99,235,0.18)",
              color: "#c7d2fe",
              fontWeight: 800,
              border: "1px solid rgba(129,140,248,0.42)",
            }}
          >
            Self-serve partner programme · no calls
          </div>

          <h1 className="landing-hero-title" style={{ marginTop: "22px", fontSize: "56px", lineHeight: 1.03, letterSpacing: "-2px", fontWeight: 950 }}>
            Sell a client-file leakage review under your own brand.
          </h1>

          <p style={{ marginTop: "20px", fontSize: "19px", lineHeight: 1.65, color: "#cbd5e1" }}>
            Effluxa does the analysis. Your firm keeps the client relationship, the judgement and the margin. Start
            self-serve today, no partner call and no implementation.
          </p>

          <div style={{ marginTop: "28px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <Link href="/signup?plan=agency_monthly&utm_source=partners&utm_medium=owned&utm_campaign=partner_programme">
              <button className="primary-button" style={{ padding: "16px 24px" }}>Start Agency — €399/mo</button>
            </Link>
            <Link href="/instant">
              <button className="primary-button" style={{ padding: "16px 24px", background: "rgba(255,255,255,0.055)", border: "1px solid rgba(148,163,184,0.28)" }}>
                Try a free client-file check
              </button>
            </Link>
          </div>
        </div>

        <div style={{ marginTop: "46px", display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {models.map((model) => (
            <div key={model.name} style={{ padding: "26px", borderRadius: "22px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.22)" }}>
              <div style={{ fontSize: "12px", letterSpacing: "1.2px", textTransform: "uppercase", color: "#94a3b8" }}>{model.name}</div>
              <div style={{ marginTop: "8px", fontSize: "24px", fontWeight: 950 }}>{model.price}</div>
              <p style={{ marginTop: "10px", color: "#cbd5e1", lineHeight: 1.65 }}>{model.body}</p>
              <ul style={{ marginTop: "14px", paddingLeft: "18px", color: "#94a3b8", lineHeight: 1.8 }}>
                {model.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "44px", maxWidth: "940px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>What the revenue share is worth</h2>
          <p style={{ marginTop: "10px", color: "#cbd5e1", lineHeight: 1.7 }}>
            Change the numbers to match your book of business. The share is 25% of the subscription for the first
            twelve months, plus 25% of any one-off audit a client buys.
          </p>
          <PartnerCalculator />
        </div>

        <div style={{ marginTop: "44px", maxWidth: "940px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>Three ways firms use Effluxa</h2>
          <div style={{ marginTop: "18px", overflowX: "auto" }}>
            <table className="partner-table">
              <thead>
                <tr>
                  <th>Arrangement</th>
                  <th>What the firm pays</th>
                  <th>What the firm earns</th>
                  <th>Best for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Referral</td>
                  <td>{eur(DISPLAY_PRICE.proMonthly)}/month per client (billed to the client)</td>
                  <td>25% recurring for 12 months</td>
                  <td>Firms that want no extra work and no new tooling</td>
                </tr>
                <tr>
                  <td>Wholesale</td>
                  <td>From {eur(199)}/month for Agency</td>
                  <td>Rebill at {eur(DISPLAY_PRICE.agencyMonthly)}+ and keep the margin</td>
                  <td>Firms that want the client relationship and their own branding</td>
                </tr>
                <tr>
                  <td>Direct Agency</td>
                  <td>{eur(DISPLAY_PRICE.agencyMonthly)}/month</td>
                  <td>Better client conversations, no commission</td>
                  <td>Firms reviewing 20 or more client files a month</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "14px", color: "#64748b", fontSize: "13px", lineHeight: 1.6 }}>
            Agency includes up to 100 client files per month, white-label PDFs, team access and a portfolio view.
            Prices exclude taxes.
          </p>
        </div>

        <div style={{ marginTop: "44px", maxWidth: "940px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>How payout works</h2>
          <div className="partner-payouts">
            {[
              ["Attribution", "Your referral link is stored for 90 days and attached to the signup, so a client who registers later still counts."],
              ["Payout window", "Earned share is paid monthly by bank transfer or Wise, with a statement of referred accounts."],
              ["Duration", "25% of each referred subscription for its first 12 months. Annual plans pay the same rate up front."],
              ["No minimum", "There is no minimum volume and no contract to sign. Stop whenever you want."],
            ].map(([title, body]) => (
              <div key={title} className="partner-payout">
                <div className="partner-payout-title">{title}</div>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "44px", maxWidth: "940px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>Partner questions</h2>
          <div style={{ marginTop: "18px", display: "grid", gap: "14px" }}>
            {[
              [
                "Do I need to sit on calls with Effluxa?",
                "No. You send the referral link or upload the file yourself. There is no partner call, no certification and no onboarding project.",
              ],
              [
                "Can I put my own brand on the report?",
                "Yes, on Agency. The PDF carries your firm footer and you can share a controlled client link instead of sending the file.",
              ],
              [
                "What happens to my client's data?",
                "Client files stay in your workspace. A data-processing agreement is available before the first client file, and your client can be deleted at any time.",
              ],
              [
                "What if the client cancels?",
                "The share stops with the subscription. There is no clawback on months already paid.",
              ],
            ].map(([q, a]) => (
              <div key={q}>
                <div style={{ fontWeight: 900, fontSize: "16px" }}>{q}</div>
                <p style={{ marginTop: "6px", color: "#cbd5e1", lineHeight: 1.7 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "44px", maxWidth: "820px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>How it works without a phone call</h2>
          <ol style={{ marginTop: "16px", paddingLeft: "22px", color: "#cbd5e1", lineHeight: 1.9 }}>
            <li>Create an Agency account. Billing, invoices and tax are handled by Paddle.</li>
            <li>Upload a client-approved, redacted file. The audit runs automatically.</li>
            <li>Export the report with your firm footer, or share a controlled client link.</li>
            <li>Compare the next period to show what changed. Assign an owner to each action.</li>
            <li>For revenue share, use your referral link and payouts are sent monthly.</li>
          </ol>
          <p style={{ marginTop: "18px", color: "#94a3b8", lineHeight: 1.7 }}>
            A data-processing agreement is available before the first client file is uploaded:{" "}
            <Link href="/security" style={{ color: "#93c5fd" }}>security and data processing</Link>.
          </p>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
