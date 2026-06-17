"use client";

import { useState } from "react";

type Client = {
  id: string;
  name: string;
};

export default function ChangeReportClientForm({
  reportId,
  currentClientId,
  clients,
}: {
  reportId: string;
  currentClientId?: string | null;
  clients: Client[];
}) {
  const [clientId, setClientId] = useState(currentClientId || "");
  const [loading, setLoading] = useState(false);

  async function saveClient() {
    setLoading(true);

    const res = await fetch(`/api/reports/${reportId}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to update client.");
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div
      style={{
        marginTop: "18px",
        padding: "18px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: "10px" }}>
        Client Assignment
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          style={{
            flex: 1,
            minWidth: "220px",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontSize: "14px",
          }}
        >
          <option value="">No client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <button
          onClick={saveClient}
          disabled={loading}
          className="primary-button"
          style={{ padding: "10px 16px" }}
        >
          {loading ? "Saving..." : "Save Client"}
        </button>
      </div>
    </div>
  );
}
