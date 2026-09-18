"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["QUALIFIED", "Qualified"],
  ["CLOSED", "Closed"],
] as const;

export default function ContactMessageStatus({
  messageId,
  initialStatus,
}: {
  messageId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus || "NEW");
  const [saving, setSaving] = useState(false);

  async function updateStatus(nextStatus: string) {
    const previousStatus = status;
    setStatus(nextStatus);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        setStatus(previousStatus);
      }
    } catch {
      setStatus(previousStatus);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "14px", fontSize: "13px" }}>
      Lead status
      <select
        value={status}
        disabled={saving}
        onChange={(event) => updateStatus(event.target.value)}
        style={{
          padding: "8px 10px",
          borderRadius: "9px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
        }}
      >
        {STATUS_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </label>
  );
}
