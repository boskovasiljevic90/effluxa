"use client";

export default function HomePage() {
  async function goToCheckout() {
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

      <div style={{ marginTop: 60, maxWidth: 720 }}>
        <h2 style={{ fontSize: 42, fontWeight: 900, margin: 0 }}>
          AI Invoice Reconciliation
        </h2>
        <p style={{ marginTop: 16, fontSize: 18, opacity: 0.8, lineHeight: 1.4 }}>
          Upload invoices, payments and price list, then run reconciliation.
        </p>

        <div style={{ marginTop: 28, display: "flex", gap: 14, flexWrap: "wrap" }}>
          {/* PLAVO → Checkout */}
          <button
            onClick={goToCheckout}
            style={{
              background: "#0074d4",
              color: "white",
              border: "none",
              padding: "14px 18px",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
              borderRadius: 10,
              minWidth: 220,
            }}
          >
            Upgrade to Pro — $199.99/month
          </button>

          {/* CRNO → Dashboard Free */}
          <a href="/app" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "black",
                color: "white",
                border: "none",
                padding: "14px 18px",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                borderRadius: 10,
                minWidth: 220,
              }}
            >
              Go to Dashboard (Free)
            </button>
          </a>
        </div>
      </div>
    </main>
  );
}
