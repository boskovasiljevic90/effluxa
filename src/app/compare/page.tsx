import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { SEO_PAGES } from "@/content/seoPages";

export const metadata: Metadata = {
  title: "Effluxa compared with audit, spend and reporting tools | Effluxa",
  description:
    "How Effluxa differs from DataSnipper, Glean.ai, Dext, Syft, Fathom and Qwantify: scope, pricing model and when a different tool is the better choice.",
  alternates: { canonical: "https://www.effluxa.com/compare" },
};

const pages = SEO_PAGES.filter((page) => page.type === "comparison");

export default function CompareHub() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "32px 24px 70px" }}>
        <PublicHeader />
        <div style={{ marginTop: "52px" }}>
          <div className="eyebrow" style={{ color: "#c7d2fe" }}>Comparisons</div>
          <h1 className="landing-hero-title" style={{ marginTop: "14px", fontSize: "50px", lineHeight: 1.05, letterSpacing: "-1.8px", fontWeight: 950 }}>
            Different jobs, different pricing models
          </h1>
          <p style={{ marginTop: "16px", fontSize: "18px", color: "#cbd5e1", lineHeight: 1.7, maxWidth: "720px" }}>
            Effluxa is a file-first leakage audit. It is not an Excel add-in, an AP automation platform or a bookkeeping
            tool. Each page states the scope honestly, including when the other tool is the better choice.
          </p>
        </div>
        <div style={{ marginTop: "34px", display: "grid", gap: "14px" }}>
          {pages.map((page) => (
            <Link key={page.slug} href={`/compare/${page.slug}`} style={{ display: "block", padding: "22px 24px", borderRadius: "18px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.2)", color: "inherit", textDecoration: "none" }}>
              <div style={{ fontSize: "19px", fontWeight: 900 }}>{page.h1}</div>
              <p style={{ marginTop: "6px", color: "#94a3b8", lineHeight: 1.6 }}>{page.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
