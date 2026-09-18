"use client";

import { useState } from "react";
import { buildPilotFollowUpDraft } from "@/lib/pilotFollowUp";

const STATUS_OPTIONS = [
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["QUALIFIED", "Qualified"],
  ["CLOSED", "Closed"],
] as const;

export default function ContactMessageStatus({
  messageId,
  initialStatus,
  initialNextActionAt,
  initialInternalNote,
  source,
  leadName,
  followUpSignupUrl,
}: {
  messageId: string;
  initialStatus: string;
  initialNextActionAt?: string | null;
  initialInternalNote?: string | null;
  source?: string;
  leadName?: string | null;
  followUpSignupUrl?: string;
}) {
  const [status, setStatus] = useState(initialStatus || "NEW");
  const [nextActionAt, setNextActionAt] = useState(initialNextActionAt ? initialNextActionAt.slice(0, 10) : "");
  const [internalNote, setInternalNote] = useState(initialInternalNote || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [followUpCopied, setFollowUpCopied] = useState(false);

  async function saveLead() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, nextActionAt, internalNote }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Lead could not be saved.");
        return;
      }

      const data = await response.json().catch(() => null);
      if (data?.message) {
        setNextActionAt(data.message.nextActionAt ? String(data.message.nextActionAt).slice(0, 10) : "");
        setInternalNote(data.message.internalNote || "");
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Lead could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function copyFollowUpDraft() {
    const draft = buildPilotFollowUpDraft({
      name: leadName,
      signupUrl: followUpSignupUrl,
    });
    setFollowUpDraft(draft);
    setFollowUpCopied(false);

    if (!navigator.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(draft);
      setFollowUpCopied(true);
    } catch {
      setFollowUpCopied(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
          Lead status
          <select
            value={status}
            disabled={saving}
            onChange={(event) => setStatus(event.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "9px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
            }}
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
          Next action
          <input
            type="date"
            value={nextActionAt}
            disabled={saving}
            onChange={(event) => setNextActionAt(event.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "9px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
            }}
          />
        </label>

        <button
          type="button"
          className="primary-button"
          disabled={saving}
          onClick={saveLead}
          style={{ padding: "9px 14px" }}
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save lead"}
        </button>
      </div>

      <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
        Internal next-step note
        <input
          type="text"
          value={internalNote}
          disabled={saving}
          maxLength={2000}
          onChange={(event) => setInternalNote(event.target.value)}
          placeholder="e.g. Ask for a redacted invoice export"
          style={{
            padding: "8px 10px",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
          }}
        />
      </label>

      {source === "partner_pilot" && (
        <div
          style={{
            display: "grid",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(129,140,248,0.18)",
          }}
        >
          <div style={{ fontWeight: 800 }}>Manual pilot follow-up</div>
          <div className="gray" style={{ fontSize: "13px", lineHeight: 1.6 }}>
            Copy a factual next-step draft for the approved human follow-up channel. Effluxa does not send it automatically.
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={copyFollowUpDraft}
            style={{ padding: "9px 14px", width: "fit-content" }}
          >
            {followUpCopied ? "Draft copied" : "Copy follow-up draft"}
          </button>
          {followUpDraft && (
            <textarea
              readOnly
              value={followUpDraft}
              aria-label="Partner pilot follow-up draft"
              style={{
                width: "100%",
                minHeight: "190px",
                padding: "10px",
                borderRadius: "9px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontSize: "13px",
                lineHeight: 1.5,
                resize: "vertical",
              }}
            />
          )}
        </div>
      )}
      {error && <span style={{ color: "#fca5a5", fontSize: "13px" }}>{error}</span>}
    </div>
  );
}
