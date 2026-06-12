"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      alert("Please select a financial file.");
      return;
    }

    const allowedExtensions = [".pdf", ".csv", ".xlsx", ".xls"];
    const lowerName = file.name.toLowerCase();

    if (!allowedExtensions.some((ext) => lowerName.endsWith(ext))) {
      alert("Only PDF, CSV, XLSX, and XLS files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10MB.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Upload failed");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/reports/${data.upload.id}`);
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

          <button
            onClick={handleUpload}
            disabled={loading}
            className="primary-button"
          >
            {loading ? "Analyzing..." : "Analyze with Effluxa AI"}
          </button>
        </div>
      </div>
    </>
  );
}
