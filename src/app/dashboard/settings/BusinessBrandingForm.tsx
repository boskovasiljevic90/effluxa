"use client";

import { useState } from "react";

export default function BusinessBrandingForm({
  defaultCompanyName,
  defaultReportFooter,
}: {
  defaultCompanyName?: string | null;
  defaultReportFooter?: string | null;
}) {
  const [companyName, setCompanyName] = useState(defaultCompanyName || "");
  const [reportFooter, setReportFooter] = useState(defaultReportFooter || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/account/branding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ companyName, reportFooter }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to update branding.");
      setLoading(false);
      return;
    }

    alert("Business branding updated.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "18px" }}>
      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company name"
        style={inputStyle}
      />

      <textarea
        value={reportFooter}
        onChange={(e) => setReportFooter(e.target.value)}
        placeholder="Custom PDF footer, e.g. Prepared for internal financial review."
        style={{
          ...inputStyle,
          minHeight: "100px",
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
        style={{ marginTop: "14px" }}
      >
        {loading ? "Saving..." : "Save Branding"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: "15px",
  marginBottom: "12px",
};
