"use client";

import { useState } from "react";

export default function ResendInviteButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);

  async function resendInvite() {
    setLoading(true);

    const res = await fetch("/api/team/resend-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to resend invite.");
      setLoading(false);
      return;
    }

    alert("Invite resent.");
    window.location.reload();
  }

  return (
    <button
      onClick={resendInvite}
      disabled={loading}
      className="primary-button"
      style={{ padding: "9px 14px" }}
    >
      {loading ? "Sending..." : "Resend Invite"}
    </button>
  );
}
