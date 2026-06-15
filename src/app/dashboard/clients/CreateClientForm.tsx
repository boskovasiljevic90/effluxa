"use client";

import { useState } from "react";

export default function CreateClientForm() {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/clients/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, notes }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to create client.");
      setLoading(false);
      return;
    }

    setName("");
    setNotes("");
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "18px" }}>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Client name, e.g. Acme Ltd"
        style={inputStyle}
      />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes"
        style={{
          ...inputStyle,
          minHeight: "90px",
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
        style={{ marginTop: "14px" }}
      >
        {loading ? "Creating..." : "Create Client"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: "15px",
  marginBottom: "12px",
};
