"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/clientAnalytics";

export default function ReferralLinkActions({ referralLink }: { referralLink: string }) {
  const [status, setStatus] = useState<"idle" | "link" | "message" | "failed">("idle");

  const inviteMessage = `I use Effluxa to quickly find possible financial leakage in invoices and expense files. You can create a free account and preview an audit here: ${referralLink}`;

  async function copyText(value: string, successStatus: "link" | "message") {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(successStatus);
      trackClientEvent(
        successStatus === "link"
          ? "referral_link_copied"
          : "referral_invite_message_copied",
        { acquisition_channel: "partner_referral" }
      );
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div style={{ marginTop: "16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className="primary-button" onClick={() => copyText(referralLink, "link")}>
        {status === "link" ? "Link copied" : "Copy partner link"}
      </button>
      <button
        type="button"
        className="primary-button"
        onClick={() => copyText(inviteMessage, "message")}
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
      >
        {status === "message" ? "Message copied" : "Copy invite message"}
      </button>
      {status === "failed" && (
        <span className="gray" style={{ fontSize: "14px" }}>
          Copy failed. Select the link above and copy it manually.
        </span>
      )}
    </div>
  );
}
