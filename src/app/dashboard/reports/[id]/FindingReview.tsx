"use client";

import { useState } from "react";

type Verdict = "TRUE" | "FALSE" | "UNCLEAR";

const VERDICT_OPTIONS: Array<{
  value: Verdict;
  label: string;
  description: string;
}> = [
  {
    value: "TRUE",
    label: "Supported",
    description: "The evidence supports this finding.",
  },
  {
    value: "FALSE",
    label: "Not supported",
    description: "The evidence does not support this finding.",
  },
  {
    value: "UNCLEAR",
    label: "Unclear",
    description: "The team needs more evidence to decide.",
  },
];

function initialVerdict(value?: string | null): Verdict | null {
  return value === "TRUE" || value === "FALSE" || value === "UNCLEAR" ? value : null;
}

export default function FindingReview({
  reportId,
  findingId,
  initialValue,
  initialNote,
}: {
  reportId: string;
  findingId: string;
  initialValue?: string | null;
  initialNote?: string | null;
}) {
  const [verdict, setVerdict] = useState<Verdict | null>(initialVerdict(initialValue));
  const [note, setNote] = useState(initialNote || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(nextVerdict: Verdict | null = verdict) {
    if (!nextVerdict) {
      setMessage("Choose a review first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/reports/${reportId}/finding-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingId,
          verdict: nextVerdict,
          note,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "Feedback could not be saved.");
        return;
      }

      setVerdict(nextVerdict);
      setMessage("Saved");
    } catch {
      setMessage("Feedback could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: "rgba(15,23,42,0.42)",
        border: "1px solid rgba(148,163,184,0.20)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <strong>Reviewer feedback</strong>
          <div className="gray" style={{ marginTop: "4px", fontSize: "13px" }}>
            Help Effluxa improve the precision of this rule.
          </div>
        </div>
        {message && (
          <span style={{ color: message === "Saved" ? "#86efac" : "#fca5a5", fontSize: "13px", fontWeight: 800 }}>
            {message}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
        {VERDICT_OPTIONS.map((option) => {
          const selected = verdict === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              aria-pressed={selected}
              title={option.description}
              onClick={() => save(option.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "9px",
                border: selected
                  ? "1px solid rgba(96,165,250,0.85)"
                  : "1px solid rgba(255,255,255,0.12)",
                background: selected ? "rgba(37,99,235,0.30)" : "rgba(255,255,255,0.06)",
                color: "white",
                cursor: saving ? "wait" : "pointer",
                fontWeight: 800,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <label style={{ display: "grid", gap: "7px", marginTop: "12px", fontSize: "13px" }}>
        Optional reviewer note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What did your team validate or learn?"
          rows={2}
          maxLength={1000}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </label>

      <button
        type="button"
        className="primary-button"
        onClick={() => save()}
        disabled={saving || !verdict}
        style={{ marginTop: "10px", opacity: verdict ? 1 : 0.55 }}
      >
        {saving ? "Saving..." : "Save note"}
      </button>
    </div>
  );
}
