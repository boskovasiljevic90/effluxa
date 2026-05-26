"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/reports")
      .then(res => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setReports(data.uploads);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "40px", maxWidth: "900px" }}>
      <h1>Your Reports</h1>

      {reports.length === 0 && <p>No reports yet.</p>}

      {reports.map((report) => (
        <div
          key={report.id}
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "10px",
            marginTop: "20px",
            cursor: "pointer",
          }}
          onClick={() => router.push(`/dashboard/reports/${report.id}`)}
        >
          <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleString()}</p>

          <p>
            <strong>Total Expenses:</strong>{" "}
            ${report.parsedData?.total_expenses?.toLocaleString() || "N/A"}
          </p>

          <p>
            <strong>Leakage Score:</strong>{" "}
            {report.parsedData?.leakage_score ?? "N/A"}
          </p>
        </div>
      ))}
    </div>
  );
}
