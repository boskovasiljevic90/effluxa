import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PriceCreepCheckerClient from "./VendorPriceCreepCheckerClient";

export const metadata: Metadata = {
  title: "Free vendor price increase checker — compare two CSV exports | Effluxa",
  description:
    "Upload two vendor or invoice ledger exports and see which unit prices increased, by how much and on which items. Runs in your browser, nothing uploaded.",
  alternates: { canonical: "https://www.effluxa.com/tools/vendor-price-creep-checker" },
  openGraph: {
    title: "Free vendor price increase checker | Effluxa",
    description: "Compare two periods and find vendor price increases in your own CSV exports.",
    url: "https://www.effluxa.com/tools/vendor-price-creep-checker",
    siteName: "Effluxa",
    type: "website",
  },
};

const steps: Array<[string, string]> = [
  ["Export two periods", "Use the same vendor and item wording in both exports, ideally one month or one quarter apart."],
  ["Map three columns", "Vendor, item and price. If your export only has line totals, include a quantity column and the tool derives the unit price."],
  ["Check each increase", "A price change can be a contract renewal, a scope change or an unnoticed increase. Confirm which before escalating."],
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

          <h1 className="landing-hero-title" style={{ marginTop: "22px", fontSize: "54px", lineHeight: 1.04, letterSpacing: "-2px", fontWeight: 950 }}>
            Which vendor prices increased?
          </h1>

          <p style={{ marginTop: "20px", fontSize: "19px", lineHeight: 1.65, color: "#cbd5e1" }}>
            Upload an earlier and a later export. The tool matches vendor and item, compares unit prices and ranks the
            increases by estimated impact. No account, no upload, no AI model reading your data.
          </p>
        </div>

        <div style={{ marginTop: "34px" }}>
          <PriceCreepCheckerClient />
        </div>

        <div style={{ marginTop: "56px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 950 }}>How to read the result</h2>
          <div style={{ marginTop: "18px", display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {steps.map(([title, body], index) => (
              <div key={title} style={{ padding: "22px", borderRadius: "20px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.2)" }}>
                <div style={{ fontWeight: 950, color: "#c7d2fe" }}>0{index + 1}</div>
                <div style={{ fontWeight: 900, marginTop: "8px" }}>{title}</div>
                <p style={{ color: "#94a3b8", marginTop: "8px", lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "40px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <Link href="/resources/vendor-price-creep-audit" className="instant-ghost">
            Read the vendor price-creep checklist
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
