import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Free finance file tools — duplicate invoices, vendor prices, leakage | Effluxa",
  description:
    "Free tools for finance teams: duplicate invoice finder, financial file leakage check and practical review checklists. No account required.",
  alternates: { canonical: "https://www.effluxa.com/tools" },
};

const tools = [
  {
    href: "/tools/duplicate-invoice-finder",
    name: "Duplicate invoice finder",
    body: "Find exact and near-duplicate invoices in an accounts-payable CSV. Runs locally in your browser.",
    tag: "Live · free",
  },
  {
    href: "/tools/vendor-price-creep-checker",
    name: "Vendor price increase checker",
    body: "Compare two exports and see which vendor unit prices increased, ranked by estimated impact. Runs locally in your browser.",
    tag: "Live · free",
  },
  {
    href: "/instant",
    name: "Financial file leakage check",
    body: "Upload one PDF, CSV or Excel pack and get a real, evidence-linked screen across 32 financial-control rules.",
    tag: "Live · free",
  },
  {
    href: "/sample-audit",
    name: "Sample audit report",
    body: "See the structure of a complete Effluxa audit before using your own data.",
    tag: "Live · sample",
  },
];

export default function ToolsPage() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "1060px", margin: "0 auto", padding: "32px 24px 70px" }}>
        <PublicHeader />

        <div style={{ maxWidth: "760px", marginTop: "54px" }}>
          <div className="eyebrow" style={{ color: "#c7d2fe" }}>Free tools</div>
          <h1 className="landing-hero-title" style={{ marginTop: "14px", fontSize: "54px", lineHeight: 1.04, letterSpacing: "-2px", fontWeight: 950 }}>
            Start with the file you already have.
          </h1>
          <p style={{ marginTop: "18px", fontSize: "19px", lineHeight: 1.65, color: "#cbd5e1" }}>
            No demo call, no integration project and no account for the first check. Use a tool, see real output, and pay
            only when the evidence is worth acting on.
          </p>
        </div>

        <div style={{ marginTop: "38px", display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{
                display: "block",
                padding: "26px",
                borderRadius: "22px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(148,163,184,0.22)",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <div style={{ fontSize: "12px", letterSpacing: "1.2px", textTransform: "uppercase", color: "#94a3b8" }}>
                {tool.tag}
              </div>
              <div style={{ marginTop: "10px", fontSize: "22px", fontWeight: 900 }}>{tool.name}</div>
              <p style={{ marginTop: "10px", color: "#cbd5e1", lineHeight: 1.65 }}>{tool.body}</p>
              <div style={{ marginTop: "16px", color: "#93c5fd", fontWeight: 800 }}>Open tool →</div>
            </Link>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
