"use client";

import { useEffect, useState } from "react";

type Result = {
  id: string;
  status: string;
  paidTotal: number | null;
  outstanding: number | null;
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reconcile/results")
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      });
  }, []);

  function statusColor(status: string) {
    if (status === "paid") return "#16a34a";
    if (status === "partial") return "#ea580c";
    if (status === "unpaid") return "#dc2626";
    return "#666";
  }

  if (loading) {
    return <div>Loading results...</div>;
  }

  if (!results.length) {
    return <div>No reconciliation results yet.</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, marginBottom: 20 }}>
        Reconciliation Results
      </h2>

      {results.map((r) => (
        <div
          key={r.id}
          style={{
            background: "white",
            padding: 20,
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid #e5e5e5",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#666" }}>
              Invoice ID: {r.id}
            </div>

            <div
              style={{
                marginTop: 8,
                fontWeight: 600,
                color: statusColor(r.status)
              }}
            >
              {r.status.toUpperCase()}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "#666" }}>
              Paid
            </div>
            <div style={{ fontWeight: 600 }}>
              {r.paidTotal ?? 0}
            </div>

            <div style={{ fontSize: 14, color: "#666", marginTop: 10 }}>
              Outstanding
            </div>
            <div style={{ fontWeight: 600 }}>
              {r.outstanding ?? 0}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
