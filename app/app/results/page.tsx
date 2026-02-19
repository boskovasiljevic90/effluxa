"use client";

import { useEffect, useState } from "react";

export default function ResultsPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.results);
      });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>
        Reconciliation Results
      </h1>

      {data.length === 0 ? (
        <p>No results yet.</p>
      ) : (
        data.map((r) => (
          <div
            key={r.id}
            style={{
              marginTop: 20,
              padding: 20,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            <div>Status: {r.status}</div>
            <div>Paid: {r.paidTotal}</div>
            <div>Outstanding: {r.outstanding}</div>
          </div>
        ))
      )}
    </div>
  );
}
