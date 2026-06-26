"use client";

import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("effluxa_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("effluxa_cookie_consent", "accepted");
    window.location.reload();
  }

  function reject() {
    localStorage.setItem("effluxa_cookie_consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "20px",
        right: "20px",
        bottom: "20px",
        zIndex: 9999,
        maxWidth: "720px",
        margin: "0 auto",
        padding: "18px",
        borderRadius: "18px",
        background: "#0f172a",
        color: "white",
        boxShadow: "0 20px 60px rgba(15,23,42,0.35)",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: "18px" }}>
        Privacy preferences
      </div>

      <p style={{ marginTop: "8px", color: "#cbd5e1", lineHeight: 1.6 }}>
        Effluxa uses analytics cookies to understand product usage and improve the service.
      </p>

      <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
        <button
          onClick={accept}
          style={{
            padding: "11px 16px",
            borderRadius: "12px",
            border: "none",
            background: "white",
            color: "#0f172a",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Accept analytics
        </button>

        <button
          onClick={reject}
          style={{
            padding: "11px 16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "transparent",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
