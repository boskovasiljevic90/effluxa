import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { getResource, RESOURCE_SLUGS } from "../content";

export function generateStaticParams() {
  return RESOURCE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const resource = getResource(params.slug);
  if (!resource) return {};

  return {
    title: `${resource.title} | Effluxa`,
    description: resource.description,
    alternates: {
      canonical: `https://www.effluxa.com/resources/${resource.slug}`,
    },
    openGraph: {
      title: `${resource.title} | Effluxa`,
      description: resource.description,
      url: `https://www.effluxa.com/resources/${resource.slug}`,
      siteName: "Effluxa",
      type: "article",
    },
  };
}

export default function ResourcePage({ params }: { params: { slug: string } }) {
  const resource = getResource(params.slug);
  if (!resource) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 90px" }}>
        <PublicHeader />

        <article style={{ maxWidth: "880px", marginTop: "70px" }}>
          <div className="eyebrow">{resource.eyebrow}</div>
          <h1 style={{ marginTop: "16px", fontSize: "60px", lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 950 }} className="landing-hero-title">
            {resource.title}
          </h1>
          <p style={{ marginTop: "24px", fontSize: "21px", lineHeight: 1.7, color: "#475569" }}>
            {resource.intro}
          </p>

          <div style={{ marginTop: "38px", padding: "26px", borderRadius: "20px", background: "white", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 900 }}>Why this review matters</h2>
            <p style={{ marginTop: "12px", color: "#475569", lineHeight: 1.8 }}>{resource.whyItMatters}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "20px", marginTop: "24px" }}>
            <section style={{ padding: "26px", borderRadius: "20px", background: "white", border: "1px solid #e2e8f0" }}>
              <h2 style={{ fontSize: "27px", fontWeight: 900 }}>Signals to review</h2>
              <ul style={{ marginTop: "14px", paddingLeft: "22px", color: "#475569", lineHeight: 1.85 }}>
                {resource.signals.map((signal) => <li key={signal}>{signal}</li>)}
              </ul>
            </section>

            <section style={{ padding: "26px", borderRadius: "20px", background: "white", border: "1px solid #e2e8f0" }}>
              <h2 style={{ fontSize: "27px", fontWeight: 900 }}>A conservative workflow</h2>
              <ol style={{ marginTop: "14px", paddingLeft: "22px", color: "#475569", lineHeight: 1.85 }}>
                {resource.workflow.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </section>
          </div>

          <section style={{ marginTop: "24px", padding: "26px", borderRadius: "20px", background: "#0f172a", color: "white" }}>
            <h2 style={{ fontSize: "27px", fontWeight: 900 }}>Questions before you act</h2>
            <ul style={{ marginTop: "14px", paddingLeft: "22px", color: "#cbd5e1", lineHeight: 1.85 }}>
              {resource.questions.map((question) => <li key={question}>{question}</li>)}
            </ul>
          </section>

          <div style={{ marginTop: "24px", padding: "22px 26px", borderRadius: "18px", background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", lineHeight: 1.7 }}>
            <strong>Important limitation:</strong> {resource.caveat}
          </div>

          <div style={{ marginTop: "42px", padding: "30px", borderRadius: "24px", background: "#eef2ff", border: "1px solid #c7d2fe", textAlign: "center" }}>
            <h2 style={{ fontSize: "30px", fontWeight: 950 }}>Use your next file as the starting point.</h2>
            <p style={{ marginTop: "10px", color: "#3730a3", lineHeight: 1.7 }}>
              Effluxa can screen a supported file, show the evidence and turn a review signal into an assigned control action.
            </p>
            <Link href={`/sample-audit?utm_source=resource_detail&utm_medium=owned&utm_campaign=organic_content&utm_content=${resource.slug}`}>
              <button className="primary-button" style={{ marginTop: "22px", padding: "15px 24px" }}>
                See a sample audit
              </button>
            </Link>
            <Link href={`/signup?utm_source=resource_detail&utm_medium=owned&utm_campaign=organic_content&utm_content=${resource.slug}_start`} style={{ display: "inline-block", marginLeft: "12px" }}>
              <button className="primary-button" style={{ marginTop: "22px", padding: "15px 24px", background: "white", color: "#0f172a", border: "1px solid #cbd5e1" }}>
              Start free
            </button>
          </Link>
          <Link href={`/for-accounting-firms?utm_source=resource_detail&utm_medium=owned&utm_campaign=partner_channel&utm_content=${resource.slug}_partner`} style={{ display: "inline-block", marginLeft: "12px" }}>
            <button className="primary-button" style={{ marginTop: "22px", padding: "15px 24px", background: "#312e81", color: "white" }}>
              For accounting firms
            </button>
          </Link>
          </div>
        </article>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: resource.title,
            description: resource.description,
            author: { "@type": "Organization", name: "Effluxa" },
            publisher: { "@type": "Organization", name: "Effluxa" },
            mainEntityOfPage: `https://www.effluxa.com/resources/${resource.slug}`,
          }),
        }}
      />

      <PublicFooter />
    </main>
  );
}
