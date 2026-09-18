import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { RESOURCE_CONTENT } from "./content";

export const metadata: Metadata = {
  title: "Financial Leakage Audit Guides | Effluxa",
  description:
    "Practical, evidence-first guides for duplicate invoices, vendor price creep and recurring software spend audits.",
  alternates: {
    canonical: "https://www.effluxa.com/resources",
  },
  openGraph: {
    title: "Financial Leakage Audit Guides | Effluxa",
    description:
      "Use the financial files you already have to review common leakage and control problems with a clear, conservative workflow.",
    url: "https://www.effluxa.com/resources",
    siteName: "Effluxa",
    type: "website",
  },
};

export default function ResourcesPage() {
  const resources = Object.values(RESOURCE_CONTENT);

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 90px" }}>
        <PublicHeader />

        <div style={{ maxWidth: "820px", marginTop: "70px" }}>
          <div className="eyebrow">Effluxa resources</div>
          <h1 style={{ marginTop: "14px", fontSize: "64px", lineHeight: 1, letterSpacing: "-3px", fontWeight: 950 }} className="landing-hero-title">
            Practical guides for finding financial leakage.
          </h1>
          <p style={{ marginTop: "24px", fontSize: "21px", lineHeight: 1.7, color: "#475569", maxWidth: "760px" }}>
            Start with the evidence you already have. These guides explain what to compare, what can be misleading and how to turn a possible issue into a reviewable control action.
          </p>
        </div>

        <div style={{ marginTop: "54px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "20px" }}>
          {resources.map((resource) => (
            <article key={resource.slug} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "28px", boxShadow: "0 12px 35px rgba(15,23,42,0.05)" }}>
              <div className="eyebrow">{resource.eyebrow}</div>
              <h2 style={{ marginTop: "14px", fontSize: "27px", lineHeight: 1.15, fontWeight: 900 }}>{resource.title}</h2>
              <p style={{ marginTop: "14px", color: "#475569", lineHeight: 1.7 }}>{resource.description}</p>
              <Link href={`/resources/${resource.slug}`} style={{ display: "inline-block", marginTop: "22px", color: "#2563eb", fontWeight: 850 }}>
                Read the guide →
              </Link>
            </article>
          ))}
        </div>

        <div style={{ marginTop: "56px", padding: "30px", borderRadius: "24px", background: "#eef2ff", border: "1px solid #c7d2fe", textAlign: "center" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 950 }}>Ready to test a real file?</h2>
          <p style={{ marginTop: "10px", color: "#3730a3", lineHeight: 1.7 }}>
            Use a safe invoice batch, expense export or statement and review the evidence before taking action.
          </p>
          <Link href="/sample-audit">
            <button className="primary-button" style={{ marginTop: "22px", padding: "15px 24px" }}>
              View a sample audit
            </button>
          </Link>
          <Link href="/signup" style={{ display: "inline-block", marginLeft: "12px" }}>
            <button className="primary-button" style={{ marginTop: "22px", padding: "15px 24px", background: "white", color: "#0f172a", border: "1px solid #cbd5e1" }}>
              Start free
            </button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
