"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/clientAnalytics";

export default function ReferralLinkActions({ referralLink }: { referralLink: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setStatus("copied");
      trackClientEvent("referral_link_copied", {
        acquisition_channel: "partner_referral",
      });
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div style={{ marginTop: "16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className="primary-button" onClick={copyReferralLink}>
        {status === "copied" ? "Copied" : "Copy partner link"}
      </button>
      {status === "failed" && (
        <span className="gray" style={{ fontSize: "14px" }}>
          Copy failed. Select the link above and copy it manually.
        </span>
      )}
    </div>
  );
}
