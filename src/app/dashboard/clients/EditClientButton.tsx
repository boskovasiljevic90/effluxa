"use client";

import { useState } from "react";

export default function EditClientButton({
  clientId,
  defaultName,
  defaultNotes,
}: {
  clientId: string;
  defaultName: string;
  defaultNotes?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [notes, setNotes] = useState(defaultNotes || "");
  const [loading, setLoading] = useState(false);

  async function updateClient() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Client name is required.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/clients/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        name: trimmedName,
        notes,
      }),
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="primary-button"
        style={{ padding: "9px 14px" }}
      >
        Edit
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15,23,42,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="card-title">Edit Client</div>

            <p className="gray" style={{ marginTop: "10px" }}>
              Update the client name or internal notes.
            </p>

            <div style={{ marginTop: "22px" }}>
              <label className="gray" style={{ display: "block", marginBottom: "8px" }}>
                Client name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontSize: "15px",
                }}
              />
            </div>

            <div style={{ marginTop: "16px" }}>
              <label className="gray" style={{ display: "block", marginBottom: "8px" }}>
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontSize: "15px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "22px", flexWrap: "wrap" }}>
              <button
                onClick={updateClient}
                disabled={loading}
                className="primary-button"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>

              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                style={{
                  padding: "12px 18px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
