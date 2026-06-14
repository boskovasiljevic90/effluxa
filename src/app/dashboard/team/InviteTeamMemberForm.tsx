"use client";

import { useState } from "react";

export default function InviteTeamMemberForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to invite team member.");
      setLoading(false);
      return;
    }

    setEmail("");
    window.location.reload();
  }

  return (
    <form onSubmit={handleInvite} style={{ marginTop: "20px" }}>
      <input
        type="email"
        required
        placeholder="teammate@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
        style={{ marginTop: "14px" }}
      >
        {loading ? "Inviting..." : "Invite Team Member"}
      </button>
    </form>
  );
}
