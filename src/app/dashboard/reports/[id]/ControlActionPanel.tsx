"use client";

import { useState } from "react";

type ControlFinding = {
  id: string;
  title: string;
  severity: string;
  category: string;
  ruleId: string;
  recommendedAction: string;
  evidenceCount: number;
  quantifiedAmount: number | null;
  currency: string;
};

type SavedControlAction = {
  id: string;
  findingId: string;
  findingTitle: string;
  findingSeverity: string;
  status: string;
  ownerEmail: string | null;
  dueDate: string | null;
  outcomeNote: string | null;
  quantifiedAmount: number | null;
  resolvedAmount: number | null;
  currency: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  ["OPEN", "Open"],
  ["IN_REVIEW", "In review"],
  ["ACTIONED", "Actioned"],
  ["DISMISSED", "Dismissed"],
] as const;

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function statusLabel(value: string) {
  return STATUS_OPTIONS.find(([status]) => status === value)?.[1] || value;
}

function severityColor(value: string) {
  const severity = value.toUpperCase();
  if (severity === "CRITICAL") return "#f87171";
  if (severity === "HIGH") return "#fb923c";
  if (severity === "MEDIUM") return "#facc15";
  return "#60a5fa";
}

function ActionEditor({
  reportId,
  finding,
  action,
  onSaved,
}: {
  reportId: string;
  finding: ControlFinding;
  action?: SavedControlAction;
  onSaved: (action: SavedControlAction) => void;
}) {
  const [expanded, setExpanded] = useState(Boolean(action));
  const [status, setStatus] = useState(action?.status || "OPEN");
  const [ownerEmail, setOwnerEmail] = useState(action?.ownerEmail || "");
  const [dueDate, setDueDate] = useState(dateInputValue(action?.dueDate));
  const [outcomeNote, setOutcomeNote] = useState(action?.outcomeNote || "");
  const [resolvedAmount, setResolvedAmount] = useState(
    action?.resolvedAmount === null || action?.resolvedAmount === undefined
      ? ""
      : String(action.resolvedAmount)
  );
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  async function save() {
    setSaving(true);
    setSavedMessage("");

    try {
      const response = await fetch(`/api/reports/${reportId}/controls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingId: finding.id,
          status,
          ownerEmail,
          dueDate,
          outcomeNote,
          resolvedAmount,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSavedMessage(data.error || "The control action could not be saved.");
        return;
      }

      onSaved(data.action);
      setSavedMessage("Saved");
    } catch {
      setSavedMessage("The control action could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "14px",
        padding: "16px",
        borderRadius: "14px",
        background: "rgba(15,23,42,0.42)",
        border: "1px solid rgba(148,163,184,0.20)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 800 }}>Control follow-up</div>
          <div className="gray" style={{ marginTop: "5px", fontSize: "13px" }}>
            {finding.evidenceCount} evidence item{finding.evidenceCount === 1 ? "" : "s"} · {finding.ruleId || "rule not specified"}
          </div>
        </div>
        <div
          style={{
            color: action ? "#86efac" : "#cbd5e1",
            fontSize: "13px",
            fontWeight: 800,
          }}
        >
          {action ? `Tracked · ${statusLabel(status)}` : "Not tracked yet"}
        </div>
      </div>

      {expanded ? (
        <>
          <p className="gray" style={{ marginTop: "12px", lineHeight: 1.6, fontSize: "14px" }}>
            {finding.recommendedAction}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: "12px",
              marginTop: "14px",
            }}
          >
            <label style={{ display: "grid", gap: "7px", fontSize: "13px" }}>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                style={{
                  padding: "11px 12px",
                  borderRadius: "10px",
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

            <label style={{ display: "grid", gap: "7px", fontSize: "13px" }}>
              Owner email
              <input
                type="email"
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                placeholder="finance@company.com"
                style={{
                  padding: "11px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: "7px", fontSize: "13px" }}>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                style={{
                  padding: "11px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: "7px", fontSize: "13px" }}>
              Verified recovered amount ({finding.currency})
              <input
                type="number"
                min="0"
                step="0.01"
                value={resolvedAmount}
                onChange={(event) => setResolvedAmount(event.target.value)}
                placeholder="Only after verification"
                style={{
                  padding: "11px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                }}
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: "7px", fontSize: "13px", marginTop: "12px" }}>
            Outcome / verification note
            <textarea
              value={outcomeNote}
              onChange={(event) => setOutcomeNote(event.target.value)}
              placeholder="Record what was checked, changed, or dismissed and why."
              rows={3}
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            <button className="primary-button" onClick={save} disabled={saving}>
              {saving ? "Saving..." : action ? "Update Control" : "Track Control"}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setExpanded(false)}
              disabled={saving}
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              Hide Editor
            </button>
            {savedMessage && (
              <span style={{ color: savedMessage === "Saved" ? "#86efac" : "#fca5a5", fontSize: "13px" }}>
                {savedMessage}
              </span>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          className="primary-button"
          onClick={() => setExpanded(true)}
          style={{ marginTop: "12px" }}
        >
          {action ? "Edit Control" : "Track This Control"}
        </button>
      )}
    </div>
  );
}

export default function ControlActionPanel({
  reportId,
  findings,
  actions,
}: {
  reportId: string;
  findings: ControlFinding[];
  actions: SavedControlAction[];
}) {
  const [actionsByFinding, setActionsByFinding] = useState<Record<string, SavedControlAction>>(
    Object.fromEntries(actions.map((action) => [action.findingId, action]))
  );

  if (findings.length === 0) return null;

  return (
    <div className="audit-card" style={{ marginTop: "28px" }}>
      <div className="audit-section-kicker">Continuous control workflow</div>
      <h2>Assign and verify follow-up</h2>
      <p className="gray" style={{ marginTop: "10px", lineHeight: 1.7 }}>
        Convert a verified finding into an accountable control action. A recovered amount is only recorded when your team verifies it; Effluxa does not treat an estimate as realised savings.
      </p>

      <div style={{ display: "grid", gap: "14px", marginTop: "18px" }}>
        {findings.map((finding) => (
          <div
            key={finding.id}
            style={{
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(148,163,184,0.22)",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <span style={{ color: severityColor(finding.severity), fontWeight: 900, fontSize: "12px" }}>
                {finding.severity}
              </span>
              <strong style={{ flex: "1 1 260px" }}>{finding.title}</strong>
              <span className="gray" style={{ fontSize: "13px" }}>
                {finding.quantifiedAmount === null || finding.quantifiedAmount === undefined
                  ? "Unquantified"
                  : `${finding.currency} ${finding.quantifiedAmount.toLocaleString()}`}
              </span>
            </div>

            <ActionEditor
              reportId={reportId}
              finding={finding}
              action={actionsByFinding[finding.id]}
              onSaved={(action) =>
                setActionsByFinding((current) => ({ ...current, [finding.id]: action }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
