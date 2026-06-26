"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/clientAnalytics";

export default function UpgradeButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    try {
      setLoading(true);
      trackClientEvent("report_unlock_checkout_started", { report_id: reportId });

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert(data?.error || "Stripe error");
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Stripe error");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="primary-button"
      style={{
        marginTop: "15px",
      }}
    >
      {loading ? "Redirecting..." : "Unlock Full Audit — €29"}
    </button>
  );
}
