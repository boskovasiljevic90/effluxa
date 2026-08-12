"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function openBillingPortal() {
    setLoading(true);

    try {
      const res = await fetch("/api/paddle/create-billing-portal", {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to open billing portal.");
        return;
      }

      if (!data?.url) {
        alert("Billing portal link is unavailable. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("BILLING PORTAL UI ERROR:", error);
      alert("We couldn't open billing right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={openBillingPortal}
      disabled={loading}
      className="primary-button"
      style={{ marginTop: "18px" }}
    >
      {loading ? "Opening..." : "Manage Billing"}
    </button>
  );
}
