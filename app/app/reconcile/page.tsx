"use client";

import { useState } from "react";

export default function ReconcilePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runReconcile() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/reconcile/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orgId: "demo-org", // privremeno hardcoded
      }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>
        Run Reconciliation
      </h1>

      <button
        onClick={runReconcile}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          background: "black",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        {loading ? "Running..." : "Run Reconciliation"}
      </button>

      {result && (
        <pre style={{ marginTop: 30 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
