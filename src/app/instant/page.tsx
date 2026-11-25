import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import InstantAuditClient from "./InstantAuditClient";

export const metadata: Metadata = {
  title: "Free financial file check — duplicate payments & leakage | Effluxa",
  description:
    "Upload one invoice pack, AP ledger, bank statement or Excel export and get a real, evidence-linked leakage check in minutes. No account, no email, no card.",
  alternates: { canonical: "https://www.effluxa.com/instant" },
  openGraph: {
    title: "Free financial file check | Effluxa",
    description:
      "Real AI financial-control screen of your own file: duplicate payments, vendor overcharging, wasted spend. No signup required.",
    url: "https://www.effluxa.com/instant",
    siteName: "Effluxa",
    type: "website",
  },
};

const faqs: Array<[string, string]> = [
  [
    "What do I get for free?",
    "A real screen of your own file: leakage score, risk level, the three highest-value findings and the count of remaining findings. No account required.",
  ],
  [
    "What files work best?",
    "Accounts-payable invoice ledgers, payment runs, bank statements and full management packs in PDF, CSV, XLSX or XLS. More complete data means more verified findings.",
  ],
  [
    "Is this a guarantee that money is recoverable?",
    "No. Every finding is a review signal with source evidence and a confidence level. A person must confirm the transaction before anything is treated as a loss or a saving.",
  ],
  [
    "Is my file stored?",
    "Anonymous checks are processed to produce the result and are not kept as a customer record. When you create an account, your reports are stored in your workspace so you can review history and delete them at any time.",
  ],
];

export default function InstantAuditPage() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 24px 40px" }}>
        <PublicHeader />

        <div style={{ maxWidth: "860px", marginTop: "54px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "10px 18px",
              borderRadius: "999px",
              background: "rgba(37,99,235,0.18)",
              color: "#c7d2fe",
              fontWeight: 800,
              border: "1px solid rgba(129,140,248,0.42)",
            }}
          >
            Free check · no account · no email
          </div>

          <h1
            className="landing-hero-title"
            style={{ marginTop: "24px", fontSize: "62px", lineHeight: 1.02, letterSpacing: "-2.5px", fontWeight: 950 }}
          >
            Check one financial file for leakage before you pay anything.
          </h1>

          <p style={{ marginTop: "22px", fontSize: "20px", lineHeight: 1.65, color: "#cbd5e1", maxWidth: "760px" }}>
            Effluxa reads your invoice ledger, payments or management pack and returns a ranked, evidence-linked
            leakage screen: duplicate payments, vendor overcharging, wasted recurring spend, cash-pressure signals
            and control exceptions.
          </p>
        </div>

        <div style={{ marginTop: "38px" }}>
          <InstantAuditClient />
        </div>

        <div style={{ marginTop: "64px", display: "grid", gap: "18px", maxWidth: "860px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>What happens next</h2>
          {faqs.map(([question, answer]) => (
            <div key={question} style={{ borderTop: "1px solid rgba(148,163,184,0.2)", paddingTop: "16px" }}>
              <div style={{ fontWeight: 900, fontSize: "17px" }}>{question}</div>
              <p style={{ color: "#cbd5e1", marginTop: "6px", lineHeight: 1.7 }}>{answer}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "50px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link href="/sample-audit" className="instant-ghost">
            View a complete sample report
          </Link>
          <Link href="/for-accounting-firms" className="instant-ghost">
            Running a client portfolio?
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
