"use client";

import { useEffect, useState } from "react";
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

export default function UploadClient() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients/list");
        const data = await res.json();

        if (res.ok) {
          setClients(data.clients || []);
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
      setError("File is too large. Maximum size is 10MB.");
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
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Upload Financial File</div>
          <p className="gray" style={{ marginTop: "10px" }}>
            Upload PDF, CSV, or Excel files and generate an AI Financial Leak Audit.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="upload-box">
          <h2 style={{ marginBottom: "20px" }}>
            Start New AI Audit
          </h2>

          <p className="gray">
            Supported files: PDF invoices, bank statements, CSV exports, Excel reports, and expense files.
          </p>

          <p className="gray" style={{ marginTop: "10px" }}>
            Maximum file size: 10MB.
          </p>

          {clients.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <label
                className="gray"
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: 700,
                }}
              >
                Attach audit to client
              </label>

              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  fontSize: "15px",
                }}
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

          <input
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{
              marginTop: "30px",
              marginBottom: "24px",
              color: "white",
            }}
          />

          {file && (
            <div
              style={{
                marginBottom: "24px",
                padding: "14px 18px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.06)",
                color: "#cbd5e1",
              }}
            >
              Selected: {file.name}
            </div>
          )}


          {(error || statusMessage) && (
            <div
              role={error ? "alert" : "status"}
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "14px",
                border: error ? "1px solid #fecaca" : "1px solid #bae6fd",
                background: error ? "#fef2f2" : "#f0f9ff",
                color: error ? "#991b1b" : "#075985",
                lineHeight: 1.6,
                fontWeight: 600,
              }}
            >
              {error || statusMessage}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="primary-button"
          >
            {loading ? statusMessage || "Analyzing..." : "Analyze with Effluxa AI"}
          </button>
        </div>
      </div>
    </>
  );
}
