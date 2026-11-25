import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Security, data processing and privacy | Effluxa",
  description:
    "How Effluxa handles uploaded financial files, which sub-processors are used, what is retained, and the data-processing terms available to firms and businesses.",
  alternates: { canonical: "https://www.effluxa.com/security" },
};

const sections: Array<[string, string[]]> = [
  [
    "What happens to an uploaded file",
    [
      "A file is parsed to text or rows so the audit engine can extract structured financial records.",
      "The extracted structure is processed by an AI model to produce records, and deterministic rules then produce findings with evidence.",
      "Generated reports are stored in the account workspace so a customer can review history, export it or delete it.",
      "Files are never used to train a public model. Effluxa does not sell customer data.",
    ],
  ],
  [
    "Anonymous free checks",
    [
      "A free check on /instant is processed to produce the result shown on screen.",
      "The result is not saved as a customer record and the file is not attached to an account.",
      "Operational metrics record counts and timing only — never file contents, file names or vendor names.",
    ],
  ],
  [
    "Deletion",
    [
      "A customer can delete an individual report or a client portfolio from the dashboard.",
      "Account deletion removes reports, clients, team memberships, support messages, reset tokens and events in one transaction.",
      "A scheduled retention job removes expired reset tokens, old operational events and old contact messages.",
    ],
  ],
  [
    "Sub-processors",
    [
      "Hosting and edge runtime: Vercel.",
      "Database: Neon (PostgreSQL).",
      "AI inference: OpenAI (API data is not used for training under the API terms).",
      "Payments: Paddle, which acts as merchant of record and handles sales tax.",
      "Transactional email: Resend.",
    ],
  ],
  [
    "For firms and businesses",
    [
      "A data-processing agreement is available for Agency customers before client files are uploaded.",
      "Upload client-approved, redacted files where possible. Effluxa does not require full bank details to produce a first review.",
      "Effluxa is a screening and decision-support tool. It is not an audit opinion, legal advice or a guarantee of savings.",
    ],
  ],
];

export default function SecurityPage() {
  return (
    <main className="public-dark-page" style={{ background: "#0b1020", color: "#f8fafc", minHeight: "100vh" }}>
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 70px" }}>
        <PublicHeader />

        <div style={{ marginTop: "52px" }}>
          <div className="eyebrow" style={{ color: "#c7d2fe" }}>Trust</div>
          <h1 className="landing-hero-title" style={{ marginTop: "14px", fontSize: "52px", lineHeight: 1.05, letterSpacing: "-1.8px", fontWeight: 950 }}>
            Security and data processing
          </h1>
          <p style={{ marginTop: "18px", fontSize: "18px", lineHeight: 1.7, color: "#cbd5e1", maxWidth: "720px" }}>
            Finance files are sensitive. This page states exactly what Effluxa does with them so a firm can decide
            before uploading a client document.
          </p>
        </div>

        <div style={{ marginTop: "36px", display: "grid", gap: "26px" }}>
          {sections.map(([title, points]) => (
            <div key={title} style={{ padding: "24px 26px", borderRadius: "22px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(148,163,184,0.2)" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 900 }}>{title}</h2>
              <ul style={{ marginTop: "12px", paddingLeft: "20px", color: "#cbd5e1", lineHeight: 1.8 }}>
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "34px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <Link href="/contact?subject=DPA%20request&source=dpa" className="instant-ghost">
            Request the data-processing agreement
          </Link>
          <Link href="/privacy" className="instant-ghost">Privacy policy</Link>
          <Link href="/terms" className="instant-ghost">Terms of service</Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
