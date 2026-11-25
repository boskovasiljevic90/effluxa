import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import DuplicateInvoiceFinderClient from "./DuplicateInvoiceFinderClient";

export const metadata: Metadata = {
  title: "Free duplicate invoice finder — check a ledger in your browser | Effluxa",
  description:
    "Upload an invoice or payment ledger CSV and find exact and near-duplicate invoices instantly. Runs entirely in your browser — no upload, no account, no AI.",
  alternates: { canonical: "https://www.effluxa.com/tools/duplicate-invoice-finder" },
  openGraph: {
    title: "Free duplicate invoice finder | Effluxa",
    description:
      "Find exact and near-duplicate invoices in a CSV ledger. Local, private, free.",
    url: "https://www.effluxa.com/tools/duplicate-invoice-finder",
    siteName: "Effluxa",
    type: "website",
  },
};

const steps: Array<[string, string]> = [
  ["Export the ledger", "Any accounts-payable export with vendor, amount, invoice reference and date columns works."],
  ["Check the mapping", "The tool detects the columns. Correct the mapping if a header is ambiguous."],
  ["Review each match", "A duplicate row is a review signal. Confirm payment status, credit notes and approval before acting."],
];

export default function Page() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "1060px", margin: "0 auto", padding: "32px 24px 60px" }}>
        <PublicHeader />

        <div style={{ maxWidth: "820px", marginTop: "52px" }}>
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
            Free tool · runs in your browser · nothing uploaded
          </div>

          <h1 className="landing-hero-title" style={{ marginTop: "22px", fontSize: "56px", lineHeight: 1.03, letterSpacing: "-2px", fontWeight: 950 }}>
            Find duplicate invoices in a ledger CSV.
          </h1>

          <p style={{ marginTop: "20px", fontSize: "19px", lineHeight: 1.65, color: "#cbd5e1" }}>
            Exact duplicates, same vendor and amount with a different reference, and matches inside a 45-day window.
            No account, no upload, no AI model reading your data.
          </p>
        </div>

        <div style={{ marginTop: "36px" }}>
          <DuplicateInvoiceFinderClient />
        </div>

        <div style={{ marginTop: "60px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>How to review the result</h2>
          <div style={{ marginTop: "20px", display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {steps.map(([title, body], index) => (
              <div key={title} style={{ padding: "22px", borderRadius: "20px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.2)" }}>
                <div style={{ fontWeight: 950, color: "#c7d2fe" }}>0{index + 1}</div>
                <div style={{ fontWeight: 900, marginTop: "8px" }}>{title}</div>
                <p style={{ color: "#94a3b8", marginTop: "8px", lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "44px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <Link href="/resources/duplicate-invoice-audit" className="instant-ghost">
            Read the full duplicate-invoice checklist
          </Link>
          <Link href="/instant" className="instant-ghost">
            Run an AI screen on the whole file
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
