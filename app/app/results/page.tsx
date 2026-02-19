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
    if (status === "paid") return "bg-green-100 text-green-700";
    if (status === "partial") return "bg-orange-100 text-orange-700";
    if (status === "unpaid") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  }

  if (loading) {
    return <div className="text-gray-500">Loading results...</div>;
  }

  if (!results.length) {
    return (
      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-xl font-semibold mb-2">
          No reconciliation results yet
        </h2>
        <p className="text-gray-500">
          Upload invoices and run reconciliation first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">
        Reconciliation Results
      </h2>

      {results.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
        >
          <div>
            <div className="text-sm text-gray-500 mb-1">
              Invoice ID: {r.id}
            </div>

            <span
              className={\`px-3 py-1 rounded-full text-sm font-medium \${statusColor(r.status)}\`}
            >
              {r.status.toUpperCase()}
            </span>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">
              Paid
            </div>
            <div className="font-semibold">
              {r.paidTotal ?? 0}
            </div>

            <div className="text-sm text-gray-500 mt-2">
              Outstanding
            </div>
            <div className="font-semibold">
              {r.outstanding ?? 0}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
