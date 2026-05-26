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

    const validFile = allowedExtensions.some((ext) =>
      lowerName.endsWith(ext)
    );

    if (!validFile) {
      alert("Only PDF, CSV, XLSX, and XLS files are supported.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 10MB.");
      return;
    }

    try {
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
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="page-title">
              Upload Financial File
            </div>

            <p className="gray" style={{ marginTop: "10px" }}>
              Upload PDF, CSV, or Excel files and generate an AI Financial Leak Audit.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="upload-box">
            <h2 style={{ marginBottom: "20px" }}>
              Upload Financial Document
            </h2>

            <p className="gray">
              Supported: PDF invoices, bank statements, CSV exports, Excel reports, and expense files.
            </p>

            <p className="gray" style={{ marginTop: "10px" }}>
              Maximum file size: 10MB.
            </p>

            <input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
              }}
              style={{
                marginTop: "30px",
                marginBottom: "30px",
                color: "white",
              }}
            />

            {file && (
              <p className="gray" style={{ marginBottom: "20px" }}>
                Selected file: {file.name}
              </p>
            )}

            <div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="primary-button"
              >
                {loading ? "Analyzing..." : "Analyze with Effluxa AI"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
