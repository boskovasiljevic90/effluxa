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
  initialNextActionAt,
  initialInternalNote,
}: {
  messageId: string;
  initialStatus: string;
  initialNextActionAt?: string | null;
  initialInternalNote?: string | null;
}) {
  const [status, setStatus] = useState(initialStatus || "NEW");
  const [nextActionAt, setNextActionAt] = useState(initialNextActionAt ? initialNextActionAt.slice(0, 10) : "");
  const [internalNote, setInternalNote] = useState(initialInternalNote || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function saveLead() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, nextActionAt, internalNote }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Lead could not be saved.");
        return;
      }

      const data = await response.json().catch(() => null);
      if (data?.message) {
        setNextActionAt(data.message.nextActionAt ? String(data.message.nextActionAt).slice(0, 10) : "");
        setInternalNote(data.message.internalNote || "");
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Lead could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
          Lead status
          <select
            value={status}
            disabled={saving}
            onChange={(event) => setStatus(event.target.value)}
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

        <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
          Next action
          <input
            type="date"
            value={nextActionAt}
            disabled={saving}
            onChange={(event) => setNextActionAt(event.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "9px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
            }}
          />
        </label>

        <button
          type="button"
          className="primary-button"
          disabled={saving}
          onClick={saveLead}
          style={{ padding: "9px 14px" }}
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save lead"}
        </button>
      </div>

      <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
        Internal next-step note
        <input
          type="text"
          value={internalNote}
          disabled={saving}
          maxLength={2000}
          onChange={(event) => setInternalNote(event.target.value)}
          placeholder="e.g. Ask for a redacted invoice export"
          style={{
            padding: "8px 10px",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
          }}
        />
      </label>
      {error && <span style={{ color: "#fca5a5", fontSize: "13px" }}>{error}</span>}
    </div>
  );
}
