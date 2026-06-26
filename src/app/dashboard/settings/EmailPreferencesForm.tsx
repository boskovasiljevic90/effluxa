"use client";

import { useState } from "react";

export default function EmailPreferencesForm({
  defaultMonthlySummary,
  defaultProductUpdates,
  defaultAuditReminders,
}: {
  defaultMonthlySummary: boolean;
  defaultProductUpdates: boolean;
  defaultAuditReminders: boolean;
}) {
  const [emailMonthlySummary, setEmailMonthlySummary] = useState(defaultMonthlySummary);
  const [emailProductUpdates, setEmailProductUpdates] = useState(defaultProductUpdates);
  const [emailAuditReminders, setEmailAuditReminders] = useState(defaultAuditReminders);
  const [loading, setLoading] = useState(false);

  async function savePreferences() {
    setLoading(true);

    const res = await fetch("/api/account/email-preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailMonthlySummary,
        emailProductUpdates,
        emailAuditReminders,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to update email preferences.");
      setLoading(false);
      return;
    }

    alert("Email preferences updated.");
    setLoading(false);
  }

  const rowStyle: React.CSSProperties = {
    padding: "14px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    marginTop: "12px",
  };

  return (
    <div style={{ marginTop: "18px" }}>
      <label style={rowStyle}>
        <input
          type="checkbox"
          checked={emailMonthlySummary}
          onChange={(e) => setEmailMonthlySummary(e.target.checked)}
          style={{ marginRight: "10px" }}
        />
        Monthly executive summaries
      </label>

      <label style={rowStyle}>
        <input
          type="checkbox"
          checked={emailAuditReminders}
          onChange={(e) => setEmailAuditReminders(e.target.checked)}
          style={{ marginRight: "10px" }}
        />
        Audit reminders
      </label>

      <label style={rowStyle}>
        <input
          type="checkbox"
          checked={emailProductUpdates}
          onChange={(e) => setEmailProductUpdates(e.target.checked)}
          style={{ marginRight: "10px" }}
        />
        Product updates
      </label>

      <button
        onClick={savePreferences}
        disabled={loading}
        className="primary-button"
        style={{ marginTop: "16px" }}
      >
        {loading ? "Saving..." : "Save Email Preferences"}
      </button>
    </div>
  );
}
