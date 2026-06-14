"use client";

import { useState } from "react";

export default function ShareReportButton({ reportId }: { reportId: string }) {
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function createShareLink() {
    setLoading(true);

    const res = await fetch(`/api/reports/${reportId}/share`, {
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
    alert("Share link copied.");
  }

  return (
    <div style={{ marginTop: "18px" }}>
      <button
        onClick={createShareLink}
        disabled={loading}
        className="primary-button"
      >
        {loading ? "Creating..." : "Generate Share Link"}
      </button>

      {shareUrl && (
        <div
          style={{
            marginTop: "16px",
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
            style={{ marginTop: "12px" }}
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
