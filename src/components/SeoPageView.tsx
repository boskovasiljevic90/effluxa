import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import type { SeoPage } from "@/content/seoPages";

export default function SeoPageView({ page, hub }: { page: SeoPage; hub: { href: string; label: string } }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "32px 24px 70px" }}>
        <PublicHeader />

        <nav style={{ marginTop: "34px", fontSize: "14px", color: "#94a3b8" }}>
          <Link href={hub.href} style={{ color: "#93c5fd" }}>{hub.label}</Link>
        </nav>

        <div style={{ marginTop: "18px" }}>
          <h1 className="landing-hero-title" style={{ fontSize: "50px", lineHeight: 1.06, letterSpacing: "-1.8px", fontWeight: 950 }}>
            {page.h1}
          </h1>
          {page.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} style={{ marginTop: "16px", fontSize: "18px", lineHeight: 1.7, color: "#cbd5e1" }}>
              {paragraph}
            </p>
          ))}
        </div>

        <div style={{ marginTop: "30px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/instant">
            <button className="primary-button" style={{ padding: "15px 24px" }}>Run a free file check</button>
          </Link>
          <Link href="/signup?plan=full_audit" className="instant-ghost">
            Unlock a full audit — €149
          </Link>
        </div>

        <div style={{ marginTop: "46px", display: "grid", gap: "28px" }}>
          {page.sections.map((section) => (
            <div key={section.heading}>
              <h2 style={{ fontSize: "27px", fontWeight: 900, letterSpacing: "-0.5px" }}>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} style={{ marginTop: "12px", color: "#cbd5e1", lineHeight: 1.75 }}>{paragraph}</p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul style={{ marginTop: "12px", paddingLeft: "22px", color: "#cbd5e1", lineHeight: 1.85 }}>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "46px", paddingTop: "26px", borderTop: "1px solid rgba(148,163,184,0.22)" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 950 }}>Questions</h2>
          <div style={{ marginTop: "18px", display: "grid", gap: "16px" }}>
            {page.faq.map((item) => (
              <div key={item.q}>
                <div style={{ fontWeight: 900, fontSize: "17px" }}>{item.q}</div>
                <p style={{ marginTop: "6px", color: "#cbd5e1", lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "40px", padding: "26px", borderRadius: "22px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.22)" }}>
          <div style={{ fontSize: "20px", fontWeight: 900 }}>Check your own file first</div>
          <p style={{ marginTop: "8px", color: "#cbd5e1", lineHeight: 1.7 }}>
            Upload one invoice pack, payment run or management file and get a real, evidence-linked screen with no
            account, no email and no card.
          </p>
          <Link href="/instant">
            <button className="primary-button" style={{ marginTop: "16px", padding: "14px 22px" }}>Start the free check</button>
          </Link>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </section>

      <PublicFooter />
    </main>
  );
}
