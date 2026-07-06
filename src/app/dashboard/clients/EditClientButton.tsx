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
            background: "rgba(15,23,42,.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "24px",
            overflowY: "auto",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "18px",
            }}
          >
            <div className="card-title">
              Edit Client
            </div>

            <p
              className="gray"
              style={{
                marginTop: "10px",
                marginBottom: "24px",
              }}
            >
              Update the client name or internal notes.
            </p>

            <label
              className="gray"
              style={{
                display: "block",
                marginBottom: "8px",
              }}
            >
              Client name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.05)",
                color: "white",
                marginBottom: "18px",
              }}
            />

            <label
              className="gray"
              style={{
                display: "block",
                marginBottom: "8px",
              }}
            >
              Notes
            </label>

            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.05)",
                color: "white",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                style={{
                  padding: "12px 18px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,.10)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>

              <button
                onClick={updateClient}
                disabled={loading}
                className="primary-button"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
