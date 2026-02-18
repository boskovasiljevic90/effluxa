"use client";

import { useMemo, useState } from "react";

type Kind = "invoices" | "payments" | "price-list";

function KindCard({
  kind,
  title,
  subtitle,
}: {
  kind: Kind;
  title: string;
  subtitle: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [replace, setReplace] = useState<boolean>(true);
  const [status, setStatus] = useState<"idle" | "uploading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const accept = useMemo(() => {
    // PDF is supported only for invoices (backend enforces)
    const base = ".csv,.tsv,.xlsx,.xls,.zip";
    return kind === "invoices" ? `${base},.pdf` : base;
  }, [kind]);

  async function onUpload() {
    if (!files.length) {
      setStatus("error");
      setMessage("Please choose file(s) first.");
      return;
    }

    try {
      setStatus("uploading");
      setMessage("");

      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      if (replace) fd.append("replace", "1");

      const res = await fetch(`/api/upload/${kind}`, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        setStatus("error");
        setMessage(data ? JSON.stringify(data, null, 2) : text);
        return;
      }

      setStatus("ok");
      setMessage(data ? JSON.stringify(data, null, 2) : text);
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message ?? String(e));
    }
  }

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{subtitle}</div>

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontSize: 13, opacity: 0.9 }}>
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            Replace existing data (recommended)
          </label>
        </div>

        <button
          onClick={onUpload}
          disabled={status === "uploading"}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: status === "uploading" ? "#f3f4f6" : "white",
            cursor: status === "uploading" ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
        >
          {status === "uploading" ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          type="file"
          accept={accept}
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          Allowed: {accept}
          {kind !== "invoices" ? " (PDF is only supported for invoices)" : ""}
        </div>
      </div>

      {status !== "idle" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8 }}>
            {status === "ok" ? "✅ Success" : status === "uploading" ? "⏳ Uploading" : "❌ Error"}
          </div>
          <pre
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 10,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              overflowX: "auto",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {message}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 950 }}>Upload</div>
      <div style={{ marginTop: 6, opacity: 0.75 }}>
        Upload files (CSV/TSV/XLSX/XLS/ZIP). For invoices you can also upload PDF.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 18 }}>
        <KindCard kind="invoices" title="Invoices" subtitle="Upload invoices (CSV/TSV/XLSX/XLS/ZIP/PDF)." />
        <KindCard kind="payments" title="Payments" subtitle="Upload payments (CSV/TSV/XLSX/XLS/ZIP)." />
        <KindCard kind="price-list" title="Price list" subtitle="Upload price list (CSV/TSV/XLSX/XLS/ZIP)." />
      </div>

      <div style={{ marginTop: 18 }}>
        <a
          href="/app/reconcile"
          style={{
            display: "inline-block",
            textDecoration: "none",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontWeight: 900,
            background: "white",
            color: "#111827",
          }}
        >
          Run reconciliation →
        </a>
      </div>
    </div>
  );
}
