"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function openBillingPortal() {
    setLoading(true);

    const res = await fetch("/api/paddle/create-billing-portal", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to open billing portal.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
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
