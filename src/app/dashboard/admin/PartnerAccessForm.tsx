"use client";

import { useState } from "react";

export default function PartnerAccessForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"grant" | "revoke" | null>(null);
  const [message, setMessage] = useState("");
  const [referralUrl, setReferralUrl] = useState("");

  async function updateAccess(action: "grant" | "revoke") {
    setLoading(action);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/complimentary-agency", {
        method: action === "grant" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "The access update failed.");
        return;
      }

      setReferralUrl(action === "grant" ? data.referralUrl || "" : "");
      setMessage(
        action === "grant"
          ? "Agency partner access granted for 365 days."
          : "Agency partner access revoked."
      );
    } catch {
      setMessage("The access update failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card" style={{ marginTop: "40px" }}>
      <div className="card-title">Complimentary Agency Partner Access</div>
      <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
        Grant or revoke 365-day Agency access without creating a Paddle charge.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "18px" }}>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="partner email"
          type="email"
          style={{ flex: "1 1 280px", minWidth: "240px" }}
        />
        <button
          className="primary-button"
          onClick={() => updateAccess("grant")}
          disabled={!email.trim() || Boolean(loading)}
        >
          {loading === "grant" ? "Granting..." : "Grant 365 Days"}
        </button>
        <button
          className="primary-button"
          onClick={() => updateAccess("revoke")}
          disabled={!email.trim() || Boolean(loading)}
          style={{ background: "rgba(248,113,113,0.18)", border: "1px solid rgba(248,113,113,0.35)" }}
        >
          {loading === "revoke" ? "Revoking..." : "Revoke"}
        </button>
      </div>

      {message && <p className="gray" style={{ marginTop: "14px" }}>{message}</p>}

      {referralUrl && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(96,165,250,0.08)",
            border: "1px solid rgba(96,165,250,0.20)",
          }}
        >
          <div style={{ fontWeight: 700 }}>Partner referral link</div>
          <div className="gray" style={{ marginTop: "8px", wordBreak: "break-all" }}>
            {referralUrl}
          </div>
          <button
            className="primary-button"
            style={{ marginTop: "12px" }}
            onClick={() => navigator.clipboard.writeText(referralUrl)}
          >
            Copy Referral Link
          </button>
        </div>
      )}
    </div>
  );
}
