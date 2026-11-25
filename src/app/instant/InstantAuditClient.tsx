"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/findingsPriority";
import { trackClientEvent } from "@/lib/clientAnalytics";
import type { InstantTeaser } from "@/lib/instantAudit";

const ACCEPTED = ".pdf,.csv,.xlsx,.xls";

const STAGES = [
  "Reading the file structure…",
  "Extracting invoices, payments and balances…",
  "Applying 32 financial-control rules…",
  "Verifying evidence and confidence…",
  "Ranking what to fix first…",
];

export default function InstantAuditClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [teaser, setTeaser] = useState<InstantTeaser | null>(null);
  const [dragging, setDragging] = useState(false);
  const [captureEmail, setCaptureEmail] = useState("");
  const [captureState, setCaptureState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setStage((current) => (current + 1) % STAGES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [loading]);

  const runAudit = useCallback(async (selected: File) => {
    setLoading(true);
    setError("");
    setTeaser(null);
    setStage(0);
    trackClientEvent("instant_audit_started", { size: selected.size, type: selected.type || "unknown" });

    try {
      const body = new FormData();
      body.append("file", selected);

      const response = await fetch("/api/instant-audit", { method: "POST", body });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "The free check could not be completed.");
      }

      setTeaser(data.teaser as InstantTeaser);
      trackClientEvent("instant_audit_result_viewed", {
        totalFindings: data.teaser?.totalFindings ?? 0,
        limitedData: Boolean(data.teaser?.limitedData),
      });
    } catch (auditError) {
      setError(
        auditError instanceof Error
          ? auditError.message
          : "The free check could not be completed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function sendResultByEmail() {
    if (!teaser || captureState === "sending") return;
    setCaptureState("sending");
    try {
      const response = await fetch("/api/instant-audit/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: captureEmail,
          teaser: {
            totalFindings: teaser.totalFindings,
            duplicateExposure: teaser.duplicateExposure,
            avoidableCost: teaser.avoidableCost,
            leakageScore: teaser.leakageScore,
            currency: teaser.currency,
            fileName: teaser.fileName,
          },
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Could not save that email.");
      }
      setCaptureState("sent");
      trackClientEvent("instant_audit_email_captured", {});
    } catch {
      setCaptureState("error");
    }
  }

  function onSelect(selected: File | null) {
    if (!selected) return;
    if (selected.size > 4 * 1024 * 1024) {
      setError("Free checks accept files up to 4 MB. Create a free account to analyse larger files.");
      return;
    }
    setFile(selected);
    void runAudit(selected);
  }

  function reset() {
    setFile(null);
    setTeaser(null);
    setError("");
    setStage(0);
    setCaptureState("idle");
    setCaptureEmail("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (teaser) {
    const money = teaser.duplicateExposure + teaser.avoidableCost;
    return (
      <div className="instant-result">
        <div className="instant-result-head">
          <div>
            <p className="eyebrow" style={{ color: "#c7d2fe" }}>
              Real analysis of your file · {teaser.fileName}
            </p>
            <h2 style={{ fontSize: "40px", lineHeight: 1.1, fontWeight: 950, marginTop: "10px" }}>
              {teaser.limitedData
                ? "Limited but honest signal from this file"
                : money > 0
                  ? `${formatMoney(money, teaser.currency)} of recoverable leakage signals`
                  : `${teaser.totalFindings} review items found`}
            </h2>
            <p style={{ marginTop: "12px", color: "#cbd5e1", fontSize: "17px", lineHeight: 1.65, maxWidth: "760px" }}>
              {teaser.verdict}
            </p>
          </div>

          <div className="instant-score">
            <div className="instant-score-value">{teaser.leakageScore}</div>
            <div className="instant-score-label">Leakage score</div>
            <div className="instant-score-risk">{teaser.riskLevel} risk</div>
          </div>
        </div>

        <div className="instant-stats">
          {[
            ["Findings", String(teaser.totalFindings)],
            ["Critical", String(teaser.criticalCount)],
            ["Duplicate exposure", teaser.duplicateExposure > 0 ? formatMoney(teaser.duplicateExposure, teaser.currency) : "—"],
            ["Avoidable cost", teaser.avoidableCost > 0 ? formatMoney(teaser.avoidableCost, teaser.currency) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="instant-stat">
              <div className="instant-stat-label">{label}</div>
              <div className="instant-stat-value">{value}</div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: "42px", fontSize: "24px", fontWeight: 900 }}>Act on these first</h3>
        <p style={{ color: "#94a3b8", marginTop: "6px" }}>
          Top {teaser.actNow.length} of {teaser.totalFindings} findings, ranked by recoverable value and severity.
        </p>

        <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
          {teaser.actNow.map((finding, index) => (
            <div key={`${finding.title}-${index}`} className="instant-finding">
              <div className="instant-finding-top">
                <span className={`instant-badge instant-badge-${finding.severity.toLowerCase()}`}>
                  {finding.severity}
                </span>
                <span className="instant-finding-category">{finding.category.replaceAll("_", " ").toLowerCase()}</span>
                {finding.amount ? (
                  <span className="instant-finding-amount">
                    {formatMoney(finding.amount, finding.currency)}
                  </span>
                ) : null}
              </div>
              <h4>{finding.title}</h4>
              <p>{finding.description}</p>
              {finding.recommendedAction ? (
                <p className="instant-finding-action">
                  <strong>Next step:</strong> {finding.recommendedAction}
                </p>
              ) : null}
              <div className="instant-finding-meta">
                {finding.evidenceCount > 0 ? `${finding.evidenceCount} source evidence item(s)` : "Structured evidence"}
                {" · "}
                {Math.round(finding.confidence * 100)}% confidence
              </div>
            </div>
          ))}
        </div>

        <div className="instant-paywall">
          <div>
            <p className="eyebrow" style={{ color: "#c7d2fe" }}>Full report</p>
            <h3 style={{ fontSize: "30px", fontWeight: 950, marginTop: "8px" }}>
              {teaser.locked.remainingFindings} more findings, evidence and the executive report
            </h3>
            <p style={{ color: "#cbd5e1", marginTop: "10px", lineHeight: 1.7, maxWidth: "720px" }}>
              The full audit adds every finding with source evidence, the calculation basis, a prioritised action
              plan, an executive summary and a branded PDF you can send to a client, board or lender.
              {teaser.locked.quantifiedAmount > 0
                ? ` Quantified impact across the file: ${formatMoney(teaser.locked.quantifiedAmount, teaser.currency)}.`
                : ""}
            </p>
            {teaser.locked.categories.length > 0 ? (
              <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "14px" }}>
                Locked areas: {teaser.locked.categories.map((category) => category.replaceAll("_", " ").toLowerCase()).join(" · ")}
              </p>
            ) : null}
          </div>

          <div className="instant-paywall-actions">
            <Link href="/signup?plan=full_audit&utm_source=instant_audit&utm_medium=owned&utm_campaign=free_check">
              <button className="primary-button" style={{ width: "100%", padding: "16px 22px" }}>
                Unlock the full report — €149
              </button>
            </Link>
            <Link href="/signup?plan=pro_monthly&utm_source=instant_audit&utm_medium=owned&utm_campaign=free_check">
              <button
                className="primary-button"
                style={{
                  width: "100%",
                  padding: "16px 22px",
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(148,163,184,0.28)",
                }}
              >
                Monitor this monthly — €99/mo
              </button>
            </Link>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, textAlign: "center" }}>
              Effluxa is a screening and decision-support tool. Findings are review signals, not confirmed losses.
            </p>
          </div>
        </div>

        <div className="instant-capture">
          <div>
            <div style={{ fontWeight: 900, fontSize: "17px" }}>Send this result to your inbox</div>
            <p style={{ color: "#94a3b8", marginTop: "6px", lineHeight: 1.6, fontSize: "14px" }}>
              We will email the summary plus a five-step review checklist. Five emails maximum, unsubscribe in one click.
            </p>
          </div>
          {captureState === "sent" ? (
            <div style={{ color: "#86efac", fontWeight: 800 }}>Sent. Check your inbox.</div>
          ) : (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="email"
                value={captureEmail}
                onChange={(event) => setCaptureEmail(event.target.value)}
                placeholder="you@company.com"
                aria-label="Your email address"
                className="instant-capture-input"
              />
              <button
                type="button"
                className="instant-ghost"
                onClick={sendResultByEmail}
                disabled={captureState === "sending" || !captureEmail.includes("@")}
              >
                {captureState === "sending" ? "Sending…" : "Email it to me"}
              </button>
            </div>
          )}
          {captureState === "error" ? (
            <div style={{ color: "#fca5a5", fontSize: "14px" }}>That email could not be saved. Check the address and try again.</div>
          ) : null}
        </div>

        <div style={{ marginTop: "26px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <button type="button" className="instant-ghost" onClick={reset}>
            Check another file
          </button>
          <Link href="/sample-audit" className="instant-ghost">
            See a full sample report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`instant-drop${dragging ? " instant-drop-active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          onSelect(event.dataTransfer.files?.[0] || null);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          hidden
          onChange={(event) => onSelect(event.target.files?.[0] || null)}
        />

        {loading ? (
          <div className="instant-loading">
            <div className="instant-spinner" aria-hidden="true" />
            <p style={{ fontSize: "18px", fontWeight: 800, marginTop: "18px" }}>{STAGES[stage]}</p>
            <p style={{ color: "#94a3b8", marginTop: "8px" }}>
              Real analysis usually takes 30–120 seconds. Keep this tab open.
            </p>
            <p style={{ color: "#64748b", marginTop: "8px", fontSize: "13px" }}>{file?.name}</p>
          </div>
        ) : (
          <div className="instant-drop-body">
            <div className="instant-drop-icon" aria-hidden="true">↑</div>
            <p style={{ fontSize: "22px", fontWeight: 900 }}>Drop one financial file here</p>
            <p style={{ color: "#94a3b8", marginTop: "8px", lineHeight: 1.6 }}>
              PDF invoice pack, AP ledger, bank statement, CSV or Excel export. No account, no email, no card.
            </p>
            <div className="instant-drop-cta">Run the free check</div>
            <p style={{ color: "#64748b", marginTop: "14px", fontSize: "13px" }}>
              Max 4 MB · files are processed for this check and are not stored for anonymous visits
            </p>
          </div>
        )}
      </div>

      {error ? (
        <div className="instant-error" role="alert">
          {error}
          <Link href="/signup" style={{ color: "#93c5fd", fontWeight: 800, marginLeft: "8px" }}>
            Create a free account instead
          </Link>
        </div>
      ) : null}

      <div className="instant-trust">
        {[
          ["No integration", "Start from the files you already have."],
          ["Evidence-linked", "Every finding shows its source and confidence."],
          ["32 control rules", "Duplicates, price creep, vendor concentration, cash pressure and more."],
        ].map(([title, body]) => (
          <div key={title}>
            <div style={{ fontWeight: 900 }}>{title}</div>
            <div style={{ color: "#94a3b8", marginTop: "4px", lineHeight: 1.55 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
