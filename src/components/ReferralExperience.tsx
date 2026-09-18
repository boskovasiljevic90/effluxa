"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackClientEvent } from "@/lib/clientAnalytics";
import { normalizeReferralCode } from "@/lib/referrals";

export default function ReferralExperience() {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const code = normalizeReferralCode(
      new URLSearchParams(window.location.search).get("ref")
    );

    if (!code) return;

    setReferralCode(code);
    trackClientEvent("referral_landing_viewed", {
      acquisition_channel: "partner_referral",
    });
  }, []);

  if (!referralCode) return null;

  const signupHref = `/signup?ref=${encodeURIComponent(referralCode)}`;

  return (
    <section
      aria-labelledby="partner-invitation-title"
      style={{
        marginTop: "28px",
        padding: "30px",
        borderRadius: "28px",
        color: "white",
        background:
          "linear-gradient(135deg, #172554 0%, #1e1b4b 55%, #312e81 100%)",
        border: "1px solid rgba(129,140,248,0.55)",
        boxShadow: "0 24px 60px rgba(30,41,59,0.18)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: "28px",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 13px",
              borderRadius: "999px",
              background: "rgba(165,180,252,0.16)",
              color: "#c7d2fe",
              border: "1px solid rgba(199,210,254,0.3)",
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Partner invitation
          </div>

          <h2
            id="partner-invitation-title"
            style={{
              marginTop: "18px",
              fontSize: "34px",
              lineHeight: 1.08,
              letterSpacing: "-1px",
              fontWeight: 950,
            }}
          >
            Start with a guided Effluxa preview.
          </h2>

          <p
            style={{
              marginTop: "14px",
              maxWidth: "650px",
              color: "#dbeafe",
              fontSize: "17px",
              lineHeight: 1.65,
            }}
          >
            A partner shared Effluxa with you. Create your free account, upload
            one financial file and see where hidden leakage may be costing the
            business money. No integration or payment is required to begin.
          </p>

          <div
            style={{
              marginTop: "22px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              color: "#e0e7ff",
              fontSize: "14px",
              fontWeight: 800,
            }}
          >
            <span>1. Upload</span>
            <span aria-hidden="true">→</span>
            <span>2. See the preview</span>
            <span aria-hidden="true">→</span>
            <span>3. Decide with evidence</span>
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            borderRadius: "22px",
            background: "rgba(15,23,42,0.35)",
            border: "1px solid rgba(224,231,255,0.16)",
          }}
        >
          <div style={{ color: "#c7d2fe", fontSize: "14px", fontWeight: 800 }}>
            Your partner link is saved automatically
          </div>

          <p style={{ marginTop: "10px", color: "#e0e7ff", lineHeight: 1.6 }}>
            There is no referral code to type. If you create an account, the
            partner who shared Effluxa will receive attribution automatically.
          </p>

          <Link
            href={signupHref}
            onClick={() =>
              trackClientEvent("referral_landing_cta_clicked", {
                acquisition_channel: "partner_referral",
              })
            }
            style={{
              display: "inline-flex",
              justifyContent: "center",
              width: "100%",
              marginTop: "20px",
              padding: "16px 20px",
              borderRadius: "14px",
              background: "white",
              color: "#172554",
              fontWeight: 950,
            }}
          >
            Start free preview
          </Link>

          <Link
            href="#how-it-works"
            style={{
              display: "block",
              marginTop: "14px",
              color: "#c7d2fe",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 800,
            }}
          >
            See how Effluxa works
          </Link>
        </div>
      </div>
    </section>
  );
}
