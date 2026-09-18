"use client";

import Link from "next/link";
import { trackClientEvent } from "@/lib/clientAnalytics";

type ShareGrowthCtaProps = {
  variant: "report" | "client_portfolio";
};

const copy = {
  report: {
    source: "shared_report",
    title: "Want to run the same check on your own files?",
    description:
      "Start with one PDF, CSV or Excel export and get a conservative, evidence-backed leakage preview.",
    event: "shared_report_signup_cta_clicked",
  },
  client_portfolio: {
    source: "shared_client_portfolio",
    title: "Bring this workflow to your own finance team.",
    description:
      "Use Effluxa to review the next reporting period, assign follow-up and keep a visible record of what changed.",
    event: "shared_client_portfolio_signup_cta_clicked",
  },
} as const;

export default function ShareGrowthCta({ variant }: ShareGrowthCtaProps) {
  const content = copy[variant];
  const signupHref = `/signup?utm_source=${content.source}&utm_medium=referral&utm_campaign=shared_financial_audit&utm_content=${variant}`;

  return (
    <section
      aria-labelledby={`${variant}-growth-cta-title`}
      style={{
        marginTop: "28px",
        padding: "28px",
        borderRadius: "22px",
        color: "white",
        background: "linear-gradient(135deg, #172554 0%, #312e81 100%)",
        border: "1px solid rgba(129,140,248,0.5)",
      }}
    >
      <h2 id={`${variant}-growth-cta-title`} style={{ fontSize: "26px", fontWeight: 900 }}>
        {content.title}
      </h2>
      <p style={{ marginTop: "10px", color: "#dbeafe", lineHeight: 1.7 }}>
        {content.description}
      </p>
      <Link
        href={signupHref}
        onClick={() => trackClientEvent(content.event, { acquisition_channel: content.source })}
        style={{
          display: "inline-flex",
          marginTop: "18px",
          padding: "14px 20px",
          borderRadius: "12px",
          background: "white",
          color: "#172554",
          fontWeight: 900,
        }}
      >
        Start a free audit
      </Link>
    </section>
  );
}
