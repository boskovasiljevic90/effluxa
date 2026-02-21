"use client";

import { useEffect, useState } from "react";

export default function AppDashboardPage() {
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    fetch("/api/organization/status")
      .then((r) => r.json())
      .then((d) => {
        if (d?.plan) setPlan(d.plan);
      })
      .catch(() => {});
  }, []);

  async function upgradeToPro() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: "demo-org" }),
    });

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    alert(data?.error || data?.message || "Checkout failed");
  }

  return (
    <main style={{ padding: 40 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Effluxa</h1>
        <div style={{ opacity: 0.7 }}>AI Invoice Reconciliation</div>
      </div>

      <div style={{ marginTop: 80, textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>Effluxa Dashboard</h2>
        <p style={{ marginTop: 10, opacity: 0.8 }}>
          You are using the <b>{plan.toUpperCase()}</b> plan.
        </p>

        <div style={{ marginTop: 24, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/app/upload" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "black",
                color: "white",
                padding: "12px 18px",
                fontWeight: 800,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Upload Invoices
            </button>
          </a>

          <a href="/app/results" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "#e9e9e9",
                color: "black",
                padding: "12px 18px",
                fontWeight: 800,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              View Results
            </button>
          </a>
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            onClick={upgradeToPro}
            style={{
              background: "#0074d4",
              color: "white",
              padding: "12px 18px",
              fontWeight: 900,
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              minWidth: 220,
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </main>
  );
}
