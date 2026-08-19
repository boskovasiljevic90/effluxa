"use client";

import { useState } from "react";

export default function DeleteAccountForm({ email }: { email: string }) {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (confirmation.trim().toLowerCase() !== email.toLowerCase()) {
      setError("Enter your account email exactly as shown to continue.");
      return;
    }

    if (!window.confirm("Delete your Effluxa account and stored account data? This cannot be undone.")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "We couldn't delete the account.");
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("We couldn't delete the account. Please contact support.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleDelete} style={{ marginTop: "18px" }}>
      <p className="gray" style={{ lineHeight: 1.7 }}>
        Deleting your account removes your Effluxa profile, reports, clients,
        messages and account events. Paddle keeps transaction records required
        for billing and legal compliance.
      </p>

      <label style={{ display: "block", marginTop: "18px", fontWeight: 700 }}>
        Enter {email} to confirm
      </label>
      <input
        type="email"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        placeholder={email}
        autoComplete="email"
        style={{
          width: "100%",
          maxWidth: "420px",
          marginTop: "8px",
          padding: "14px 16px",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          fontSize: "16px",
          color: "#0f172a",
          background: "#ffffff",
        }}
      />

      {error && (
        <p style={{ marginTop: "12px", color: "#f87171", fontWeight: 700 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: "18px",
          padding: "12px 18px",
          borderRadius: "12px",
          border: "1px solid rgba(248,113,113,0.45)",
          background: "rgba(248,113,113,0.12)",
          color: "#fca5a5",
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Deleting account..." : "Delete my account"}
      </button>
    </form>
  );
}
