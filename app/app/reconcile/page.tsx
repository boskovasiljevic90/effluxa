"use client";

import { useState } from "react";

export default function ReconcilePage() {
  const [out, setOut] = useState<string>("Idle.");

  async function run() {
    setOut("Clicked. Calling /api/reconcile/run ...");

    try {
      const res = await fetch("/api/reconcile/run", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
      });

      const txt = await res.text();
      setOut(`HTTP ${res.status}\n${txt}`);
    } catch (e: any) {
      setOut(`Client error: ${e?.message || String(e)}`);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>Reconciliation</h1>
      <p>Runs matching between invoices and payments and stores results.</p>

      <button
        onClick={run}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #ddd",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Run reconciliation
      </button>

      <pre style={{ marginTop: 18, background: "#111", color: "#0f0", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap" }}>
        {out}
      </pre>
    </main>
  );
}
