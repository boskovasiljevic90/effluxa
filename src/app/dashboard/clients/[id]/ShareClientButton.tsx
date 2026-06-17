"use client";

import { useState } from "react";

export default function ShareClientButton({ clientId }: { clientId: string }) {
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function createShareLink() {
    setLoading(true);

    const res = await fetch(`/api/clients/${clientId}/share`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to create share link.");
      setLoading(false);
      return;
    }

    setShareUrl(data.shareUrl);
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    alert("Client portfolio link copied.");
  }

  return (
    <div>
      <button
        onClick={createShareLink}
        disabled={loading}
        className="primary-button"
        style={{ padding: "10px 16px" }}
      >
        {loading ? "Creating..." : "Share Portfolio"}
      </button>

      {shareUrl && (
        <div
          style={{
            marginTop: "12px",
            padding: "14px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.06)",
            color: "#cbd5e1",
            wordBreak: "break-all",
          }}
        >
          {shareUrl}

          <button
            onClick={copyLink}
            className="primary-button"
            style={{ marginTop: "12px", padding: "9px 14px" }}
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
