"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";

type Row = Record<string, string>;

type Mapping = {
  vendor: string;
  invoice: string;
  date: string;
  amount: string;
};

type Match = {
  kind: "exact" | "near" | "split";
  vendor: string;
  amount: number;
  rows: Row[];
  detail: string;
};

const VENDOR_HINTS = ["vendor", "supplier", "payee", "merchant", "creditor", "name"];
const INVOICE_HINTS = ["invoice", "inv", "reference", "ref", "bill", "document", "doc"];
const DATE_HINTS = ["date", "invoice date", "posting", "value date", "due"];
const AMOUNT_HINTS = ["amount", "total", "gross", "value", "net", "debit"];

function pickColumn(headers: string[], hints: string[]) {
  const lower = headers.map((header) => header.toLowerCase().trim());
  for (const hint of hints) {
    const index = lower.findIndex((header) => header === hint || header.includes(hint));
    if (index >= 0) return headers[index];
  }
  return "";
}

function parseAmount(value: string) {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\d.,-]/g, "")
    .replace(/(\d)\.(\d{3})(?=\D|$)/g, "$1$2")
    .replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseDate(value: string) {
  if (!value) return null;
  const parsed = new Date(value.replace(/(\d{2})[./](\d{2})[./](\d{4})/, "$3-$2-$1"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function money(value: number) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export default function DuplicateInvoiceFinderClient() {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Mapping>({ vendor: "", invoice: "", date: "", amount: "" });
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null) {
    if (!file) return;
    setError("");
    setScanned(false);
    setFileName(file.name);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (result) => {
        const fields = (result.meta.fields || []).filter(Boolean);
        if (fields.length === 0 || result.data.length === 0) {
          setError("This file has no detectable header row. Export the ledger as CSV with column names in the first row.");
          return;
        }

        const nextMapping: Mapping = {
          vendor: pickColumn(fields, VENDOR_HINTS),
          invoice: pickColumn(fields, INVOICE_HINTS),
          date: pickColumn(fields, DATE_HINTS),
          amount: pickColumn(fields, AMOUNT_HINTS),
        };

        setHeaders(fields);
        setRows(result.data.slice(0, 20000));
        setMapping(nextMapping);
      },
      error: () => setError("This CSV could not be read. Try re-exporting as UTF-8 CSV."),
    });
  }

  const matches = useMemo<Match[]>(() => {
    if (!mapping.vendor || !mapping.amount || rows.length === 0) return [];

    const found: Match[] = [];
    const groups = new Map<string, Row[]>();

    for (const row of rows) {
      const vendor = String(row[mapping.vendor] || "").trim();
      const amount = parseAmount(String(row[mapping.amount] || ""));
      if (!vendor || !amount) continue;

      const invoice = mapping.invoice ? String(row[mapping.invoice] || "").trim().toLowerCase() : "";
      const key = `${vendor.toLowerCase()}|${invoice}|${amount.toFixed(2)}`;
      const bucket = groups.get(key);
      if (bucket) bucket.push(row);
      else groups.set(key, [row]);
    }

    for (const bucket of groups.values()) {
      if (bucket.length < 2) continue;
      const vendor = String(bucket[0][mapping.vendor] || "");
      const amount = parseAmount(String(bucket[0][mapping.amount] || "")) || 0;
      found.push({
        kind: "exact",
        vendor,
        amount,
        rows: bucket,
        detail: mapping.invoice
          ? "Same vendor, invoice reference and amount appear on more than one row."
          : "Same vendor and amount appear on more than one row with no invoice column selected.",
      });
    }

    // Near duplicates: same vendor, amount within 1%, different reference,
    // invoice dates within 45 days.
    const byVendor = new Map<string, Row[]>();
    for (const row of rows) {
      const vendor = String(row[mapping.vendor] || "").trim().toLowerCase();
      if (!vendor) continue;
      const bucket = byVendor.get(vendor);
      if (bucket) bucket.push(row);
      else byVendor.set(vendor, [row]);
    }

    for (const bucket of byVendor.values()) {
      if (bucket.length < 2 || bucket.length > 400) continue;
      for (let i = 0; i < bucket.length; i += 1) {
        for (let j = i + 1; j < bucket.length; j += 1) {
          const firstAmount = parseAmount(String(bucket[i][mapping.amount] || ""));
          const secondAmount = parseAmount(String(bucket[j][mapping.amount] || ""));
          if (!firstAmount || !secondAmount) continue;
          if (Math.abs(firstAmount - secondAmount) > Math.max(1, firstAmount * 0.01)) continue;

          const firstInvoice = mapping.invoice ? String(bucket[i][mapping.invoice] || "").trim().toLowerCase() : "";
          const secondInvoice = mapping.invoice ? String(bucket[j][mapping.invoice] || "").trim().toLowerCase() : "";
          if (firstInvoice && firstInvoice === secondInvoice) continue;

          const firstDate = mapping.date ? parseDate(String(bucket[i][mapping.date] || "")) : null;
          const secondDate = mapping.date ? parseDate(String(bucket[j][mapping.date] || "")) : null;
          if (firstDate && secondDate) {
            const days = Math.abs(firstDate.getTime() - secondDate.getTime()) / 86_400_000;
            if (days > 45) continue;
          }

          found.push({
            kind: "near",
            vendor: String(bucket[i][mapping.vendor] || ""),
            amount: firstAmount,
            rows: [bucket[i], bucket[j]],
            detail: "Same vendor and amount within 1%, with a different reference. Verify before treating it as a duplicate.",
          });
        }
      }
    }

    return found.sort((a, b) => b.amount - a.amount).slice(0, 40);
  }, [mapping, rows]);

  const exactTotal = matches.filter((match) => match.kind === "exact").reduce((sum, match) => sum + match.amount * (match.rows.length - 1), 0);
  const nearTotal = matches.filter((match) => match.kind === "near").reduce((sum, match) => sum + match.amount, 0);

  return (
    <div>
      {rows.length === 0 ? (
        <div
          className="instant-drop"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files?.[0] || null);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => handleFile(event.target.files?.[0] || null)}
          />
          <div className="instant-drop-body">
            <div className="instant-drop-icon" aria-hidden="true">↑</div>
            <p style={{ fontSize: "22px", fontWeight: 900 }}>Drop an invoice or payment ledger (CSV)</p>
            <p style={{ color: "#94a3b8", marginTop: "8px", lineHeight: 1.6 }}>
              Runs entirely in your browser. The file is not uploaded, not stored and not sent to an AI model.
            </p>
            <div className="instant-drop-cta">Choose a CSV file</div>
            <p style={{ color: "#64748b", marginTop: "14px", fontSize: "13px" }}>
              Needs columns for vendor, amount, and ideally invoice reference and date.
            </p>
          </div>
        </div>
      ) : null}

      {error ? <div className="instant-error">{error}</div> : null}

      {headers.length > 0 ? (
        <div style={{ marginTop: "26px" }}>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label className="tool-label" htmlFor="vendor-col">Vendor column</label>
              <select id="vendor-col" className="tool-select" value={mapping.vendor} onChange={(event) => setMapping({ ...mapping, vendor: event.target.value })}>
                <option value="">Select…</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label className="tool-label" htmlFor="amount-col">Amount column</label>
              <select id="amount-col" className="tool-select" value={mapping.amount} onChange={(event) => setMapping({ ...mapping, amount: event.target.value })}>
                <option value="">Select…</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label className="tool-label" htmlFor="invoice-col">Invoice reference</label>
              <select id="invoice-col" className="tool-select" value={mapping.invoice} onChange={(event) => setMapping({ ...mapping, invoice: event.target.value })}>
                <option value="">None</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label className="tool-label" htmlFor="date-col">Date</label>
              <select id="date-col" className="tool-select" value={mapping.date} onChange={(event) => setMapping({ ...mapping, date: event.target.value })}>
                <option value="">None</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            </div>
          </div>

          <div className="instant-stats" style={{ marginTop: "22px" }}>
            {[
              ["Rows scanned", rows.length.toLocaleString("en-GB")],
              ["Exact duplicates", String(matches.filter((match) => match.kind === "exact").length)],
              ["Near duplicates", String(matches.filter((match) => match.kind === "near").length)],
              ["Duplicate value", money(exactTotal + nearTotal)],
            ].map(([label, value]) => (
              <div key={label} className="instant-stat">
                <div className="instant-stat-label">{label}</div>
                <div className="instant-stat-value">{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "12px", color: "#94a3b8", fontSize: "13px" }}>
            {fileName} · analysis is local to this browser tab
          </div>

          {matches.length === 0 ? (
            <p style={{ marginTop: "22px", color: "#cbd5e1", lineHeight: 1.7 }}>
              No duplicate pattern was found with the selected columns. Check the column mapping above before concluding
              the ledger is clean — a missing invoice reference hides most real duplicates.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "14px", marginTop: "22px" }}>
              {matches.slice(0, 15).map((match, index) => (
                <div key={`${match.vendor}-${match.amount}-${index}`} className="instant-finding">
                  <div className="instant-finding-top">
                    <span className={`instant-badge ${match.kind === "exact" ? "instant-badge-high" : "instant-badge-medium"}`}>
                      {match.kind === "exact" ? "Exact" : "Near"}
                    </span>
                    <span className="instant-finding-category">{match.vendor}</span>
                    <span className="instant-finding-amount">{money(match.amount)}</span>
                  </div>
                  <p style={{ marginTop: "10px" }}>{match.detail}</p>
                  <div className="instant-finding-meta">{match.rows.length} matching row(s)</div>
                </div>
              ))}
            </div>
          )}

          <div className="instant-paywall" style={{ marginTop: "30px" }}>
            <div>
              <p className="eyebrow" style={{ color: "#c7d2fe" }}>What this tool cannot see</p>
              <h3 style={{ fontSize: "26px", fontWeight: 950, marginTop: "8px" }}>
                Duplicates are one of 32 leakage patterns
              </h3>
              <p style={{ color: "#cbd5e1", marginTop: "10px", lineHeight: 1.7 }}>
                This free tool only compares rows in one file. Effluxa also reviews vendor price changes, split invoices,
                vendor bank-detail changes, subscription overlap, overtime, inventory, receivables and financing costs —
                with source evidence and confidence.
              </p>
            </div>
            <div className="instant-paywall-actions">
              <Link href="/instant">
                <button className="primary-button" style={{ width: "100%", padding: "16px 22px" }}>
                  Run the full free check
                </button>
              </Link>
              <Link href="/signup?plan=full_audit">
                <button className="primary-button" style={{ width: "100%", padding: "16px 22px", background: "rgba(255,255,255,0.055)", border: "1px solid rgba(148,163,184,0.28)" }}>
                  Unlock a full audit — €149
                </button>
              </Link>
            </div>
          </div>

          <button type="button" className="instant-ghost" style={{ marginTop: "18px" }} onClick={() => { setRows([]); setHeaders([]); setFileName(""); setScanned(true); }}>
            Check another file
          </button>
        </div>
      ) : null}
    </div>
  );
}
