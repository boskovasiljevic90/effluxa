"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/clientAnalytics";

export default function BusinessUpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    try {
      setLoading(true);
      trackClientEvent("business_checkout_started");

      const res = await fetch("/api/stripe/create-business-subscription", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start subscription checkout.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Failed to start subscription checkout.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="primary-button"
      style={{ marginTop: "20px" }}
    >
      {loading ? "Opening Stripe..." : "Upgrade To Business"}
    </button>
  );
}
