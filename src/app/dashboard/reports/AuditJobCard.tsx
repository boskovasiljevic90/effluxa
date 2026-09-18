"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type AuditJobStatus = "QUEUED" | "PROCESSING" | "RETRYABLE" | "COMPLETE" | "FAILED";

type AuditJob = {
  id: string;
  fileName: string;
  fileSize: number;
  status: AuditJobStatus;
  attemptCount: number;
  maxAttempts: number;
  reportId: string | null;
  lastError: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function statusLabel(status: AuditJobStatus) {
  return {
    QUEUED: "Queued",
    PROCESSING: "Processing",
    RETRYABLE: "Waiting to retry",
    COMPLETE: "Complete",
    FAILED: "Failed",
  }[status];
}

function statusColor(status: AuditJobStatus) {
  if (status === "COMPLETE") return "#4ade80";
  if (status === "FAILED") return "#fca5a5";
  if (status === "RETRYABLE") return "#facc15";
  return "#93c5fd";
}

export default function AuditJobCard({ initialJob }: { initialJob: AuditJob }) {
  const [job, setJob] = useState(initialJob);
  const [busy, setBusy] = useState(false);
  const processingStarted = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/audit-jobs/" + initialJob.id + "/status", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.job) return null;

      setJob(data.job);
      return data.job as AuditJob;
    } catch {
      return null;
    }
  }, [initialJob.id]);

  const startProcessing = useCallback(async (retry = false) => {
    if (processingStarted.current && !retry) return;

    processingStarted.current = true;
    setBusy(true);

    try {
      await fetch("/api/audit-jobs/" + initialJob.id + "/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retry ? { retry: true } : {}),
      });
    } catch {
      // The status poll remains authoritative and will show whether the job completed.
    } finally {
      setBusy(false);
      await refresh();
    }
  }, [initialJob.id, refresh]);

  useEffect(() => {
    let active = true;

    async function tick() {
      const latest = await refresh();

      if (!active || !latest) return;

      if (latest.status === "QUEUED" && !processingStarted.current) {
        void startProcessing();
      }
    }

    void tick();
    const interval = window.setInterval(() => {
      void tick();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [refresh, startProcessing]);

  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(148,163,184,0.22)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <strong>{job.fileName}</strong>
          <div className="gray" style={{ marginTop: "6px", fontSize: "13px" }}>
            Started {new Date(job.createdAt).toLocaleString()} · Attempt {job.attemptCount}/{job.maxAttempts}
          </div>
        </div>
        <div style={{ color: statusColor(job.status), fontWeight: 900 }}>
          {statusLabel(job.status)}
        </div>
      </div>

      {job.status === "PROCESSING" && (
        <p className="gray" style={{ marginTop: "12px", lineHeight: 1.6 }}>
          Effluxa is processing this audit. You can safely leave this page; the job status is saved.
        </p>
      )}

      {job.status === "RETRYABLE" && (
        <p className="gray" style={{ marginTop: "12px", lineHeight: 1.6 }}>
          The first attempt could not finish. You can retry now or let the worker retry it automatically.
        </p>
      )}

      {job.lastError && (
        <p style={{ marginTop: "10px", color: "#fca5a5", lineHeight: 1.6 }}>
          {job.lastError}
        </p>
      )}

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "14px" }}>
        {job.reportId && (
          <Link href={"/dashboard/reports/" + job.reportId} className="primary-button">
            Open report
          </Link>
        )}

        {(job.status === "RETRYABLE" || job.status === "FAILED") && (
          <button
            type="button"
            className="primary-button"
            disabled={busy}
            onClick={() => void startProcessing(true)}
          >
            {busy ? "Retrying..." : "Retry audit"}
          </button>
        )}

        {job.status === "QUEUED" && busy && (
          <span className="gray" style={{ fontSize: "13px" }}>Starting worker...</span>
        )}
      </div>
    </div>
  );
}
