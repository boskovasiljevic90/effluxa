"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackClientEvent } from "@/lib/clientAnalytics";

type Client = {
  id: string;
  name: string;
};

type AuditJobStatus = "QUEUED" | "PROCESSING" | "RETRYABLE" | "COMPLETE" | "FAILED";

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default function UploadClient({
  initialClientId = "",
  repeatAudit = false,
}: {
  initialClientId?: string;
  repeatAudit?: boolean;
}) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(initialClientId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients/list");
        const data = await res.json();

        if (res.ok) {
          const nextClients = data.clients || [];
          setClients(nextClients);
          if (initialClientId && nextClients.some((client: Client) => client.id === initialClientId)) {
            setClientId(initialClientId);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadClients();
  }, []);

  async function monitorAuditJob(jobId: string) {
    void fetch("/api/audit-jobs/" + jobId + "/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch((processError) => {
      console.error("AUDIT JOB PROCESS REQUEST ERROR:", processError);
    });

    const deadline = Date.now() + 5 * 60 * 1000;

    while (Date.now() < deadline) {
      const statusResponse = await fetch(
        "/api/audit-jobs/" + jobId + "/status",
        { cache: "no-store" }
      );
      const statusData = await statusResponse.json().catch(() => ({}));

      if (!statusResponse.ok) {
        throw new Error(statusData.error || "Audit status could not be read.");
      }

      const job = statusData?.job as {
        status?: AuditJobStatus;
        reportId?: string | null;
        lastError?: string | null;
      } | undefined;

      if (job?.status === "COMPLETE" && job.reportId) {
        trackClientEvent("upload_completed", {
          report_id: job.reportId,
          has_client: Boolean(clientId),
        });
        setStatusMessage("Audit ready. Opening your report...");
        router.push("/dashboard/reports/" + job.reportId);
        return true;
      }

      if (job?.status === "FAILED" || job?.status === "RETRYABLE") {
        setError(job.lastError || "The audit could not be completed. You can retry it from Reports.");
        setStatusMessage("");
        return false;
      }

      if (job?.status === "QUEUED") {
        setStatusMessage("Audit queued securely. Starting the analysis...");
      } else {
        setStatusMessage("Effluxa is processing your audit. You can leave this page safely.");
      }

      await wait(Math.max(1500, Number(statusData.pollAfterMs) || 2500));
    }

    setStatusMessage("The audit is still processing in the background. Opening Reports so you can follow its status.");
    router.push("/dashboard/reports");
    return true;
  }

  const selectedClient = clients.find((client) => client.id === clientId);

  async function handleUpload() {
    setError("");
    setStatusMessage("Validating file...");

    if (!file) {
      setError("Please select a financial file.");
      setStatusMessage("");
      return;
    }

    const allowedExtensions = [".pdf", ".csv", ".xlsx", ".xls"];
    const lowerName = file.name.toLowerCase();

    if (!allowedExtensions.some((ext) => lowerName.endsWith(ext))) {
      setError("Only PDF, CSV, XLSX, and XLS files are supported.");
      setStatusMessage("");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 4MB. Upload a CSV or XLSX of the same data, or split the export.");
      setStatusMessage("");
      return;
    }

    let keepLoadingAfterFinally = false;

    try {
      setLoading(true);
      setStatusMessage("Uploading your financial document securely...");

      trackClientEvent("upload_started", {
        file_type: lowerName.split(".").pop(),
        has_client: Boolean(clientId),
      });

      const formData = new FormData();
      formData.append("file", file);

      if (clientId) {
        formData.append("clientId", clientId);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.");
        setStatusMessage("");
        return;
      }

      const jobId = data?.job?.id;

      if (!jobId) {
        setError("The audit was not queued. Please try again.");
        setStatusMessage("");
        return;
      }

      trackClientEvent("upload_queued", {
        audit_job_id: jobId,
        has_client: Boolean(clientId),
      });

      setStatusMessage("Audit queued securely. Starting the analysis...");
      keepLoadingAfterFinally = await monitorAuditJob(jobId);
    } catch (uploadError) {
      console.error(uploadError);
      setStatusMessage("The connection ended while waiting. Checking Reports for the completed audit...");
      router.push("/dashboard/reports");
    } finally {
      if (!keepLoadingAfterFinally) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <p className="dash-eyebrow">New audit</p>
          <h1 className="dash-title">Upload a financial file</h1>
          <p className="dash-sub">
            PDF invoices, bank statements, CSV or Excel exports. Every finding arrives with source evidence.
          </p>
        </div>
        <div className="dash-head-actions">
          <Link href="/dashboard/reports" className="dash-btn dash-btn-ghost">
            View reports
          </Link>
        </div>
      </div>

      {repeatAudit && (
        <div className="dash-banner">
          <div>
            <div style={{ fontWeight: 900 }}>Run the next-period audit</div>
            <p style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px", lineHeight: 1.55 }}>
              {selectedClient
                ? `Upload the equivalent file for ${selectedClient.name} so the recurring comparison stays together.`
                : "Upload the equivalent file for the next period and choose the same client to keep comparisons together."}
            </p>
          </div>
        </div>
      )}

      <section className="dash-card">
        <div className="dash-upload-grid">
          <div>
            <label htmlFor="audit-file" className="upload-drop">
              <div className="upload-drop-icon" aria-hidden="true">+</div>
              <div className="upload-drop-title">
                {file ? file.name : "Choose a financial file"}
              </div>
              <div className="upload-drop-hint">
                {file
                  ? `${Math.max(1, Math.round(file.size / 1024))} KB - click to replace`
                  : "PDF, CSV, XLSX or XLS - up to 4 MB"}
              </div>
            </label>
            <input
              id="audit-file"
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
          </div>

          <div>
            {clients.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="audit-client" className="tool-label">
                  Attach to client
                </label>
                <select
                  id="audit-client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(error || statusMessage) && (
              <div
                role={error ? "alert" : "status"}
                className={`dash-note ${error ? "dash-note-error" : "dash-note-info"}`}
              >
                {error || statusMessage}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="dash-btn dash-btn-primary"
              style={{ width: "100%", marginTop: "16px" }}
            >
              {loading ? statusMessage || "Analysing..." : "Analyse with Effluxa AI"}
            </button>

            <p className="dash-meta" style={{ marginTop: "10px" }}>
              The audit runs in the background. You can leave this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
