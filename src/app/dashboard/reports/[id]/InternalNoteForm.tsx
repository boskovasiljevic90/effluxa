"use client";

import { useState } from "react";

export default function InternalNoteForm({
  reportId,
  defaultNote,
}: {
  reportId: string;
  defaultNote?: string | null;
}) {
  const [internalNote, setInternalNote] = useState(defaultNote || "");
  const [loading, setLoading] = useState(false);

  async function saveNote() {
    setLoading(true);

    const res = await fetch(`/api/reports/${reportId}/note`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ internalNote }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to save note.");
      setLoading(false);
      return;
    }

    alert("Internal note saved.");
    setLoading(false);
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
        Internal Audit Note
      </div>

      <textarea
        value={internalNote}
        onChange={(e) => setInternalNote(e.target.value)}
        placeholder="Add private team note for this audit..."
        style={{
          width: "100%",
          minHeight: "100px",
          padding: "14px 16px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          fontSize: "15px",
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />

      <button
        onClick={saveNote}
        disabled={loading}
        className="primary-button"
        style={{ marginTop: "12px" }}
      >
        {loading ? "Saving..." : "Save Note"}
      </button>
    </div>
  );
}
