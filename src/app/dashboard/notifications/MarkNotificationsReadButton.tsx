"use client";

import { useState } from "react";

export default function MarkNotificationsReadButton() {
  const [loading, setLoading] = useState(false);

  async function markRead() {
    setLoading(true);

    const res = await fetch("/api/notifications/mark-read", {
      method: "POST",
    });

    if (!res.ok) {
      alert("Failed to mark notifications as read.");
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <button onClick={markRead} disabled={loading} className="primary-button">
      {loading ? "Saving..." : "Mark All As Read"}
    </button>
  );
}
