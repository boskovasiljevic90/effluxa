"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";

type Row = Record<string, string>;

type Mapping = {
  vendor: string;
  item: string;
  price: string;
  quantity: string;
};

type Period = {
  label: string;
  fileName: string;
  headers: string[];
  rows: Row[];
  mapping: Mapping;
};

type Comparison = {
  vendor: string;
  item: string;
  priceBefore: number;
  priceAfter: number;
  changePct: number;
  changeAbs: number;
  quantity: number | null;
  impact: number;
};

const VENDOR_HINTS = ["vendor", "supplier", "merchant", "creditor", "payee"];
const ITEM_HINTS = ["item", "description", "product", "service", "sku", "detail", "narrative"];
const PRICE_HINTS = ["unit price", "unit cost", "price", "rate", "unit amount"];
const AMOUNT_HINTS = ["amount", "total", "gross", "value", "line total"];
const QUANTITY_HINTS = ["quantity", "qty", "units", "hours", "seats"];

function pickColumn(headers: string[], hints: string[], exclude: string[] = []) {
  const lowered = headers.map((header) => header.toLowerCase().trim());
  for (const hint of hints) {
    for (let index = 0; index < lowered.length; index += 1) {
      if (exclude.includes(headers[index])) continue;
      if (lowered[index] === hint || lowered[index].includes(hint)) return headers[index];
    }
  }
  return "";
}

function parseNumber(value: string) {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\d.,-]/g, "")
    .replace(/(\d)\.(\d{3})(?=\D|$)/g, "$1$2")
    .replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function loadPeriod(
  file: File,
  label: string,
  setter: (period: Period) => void,
  onError: (message: string) => void
) {
  Papa.parse<Row>(file, {
    header: true,
    skipEmptyLines: "greedy",
    complete: (result) => {
      const headers = (result.meta.fields || []).filter(Boolean);
      if (headers.length === 0 || result.data.length === 0) {
        onError(`${label}: no header row detected. Export the ledger as CSV with column names in the first row.`);
        return;
      }

      const vendor = pickColumn(headers, VENDOR_HINTS);
      const item = pickColumn(headers, ITEM_HINTS, [vendor]);
      const price = pickColumn(headers, PRICE_HINTS, [vendor, item]);
      const quantity = pickColumn(headers, QUANTITY_HINTS);
      const amount = pickColumn(headers, AMOUNT_HINTS, [vendor, item, price]);

      setter({
        label,
        fileName: file.name,
        headers,
        rows: result.data.slice(0, 20000),
        mapping: {
          vendor,
          item,
          // Fall back to amount so a ledger without a unit-price column can
          // still be compared when no quantity column exists either.
          price: price || amount,
          quantity,
        },
      });
    },
    error: () => onError(`${label}: the CSV could not be read. Try re-exporting as UTF-8 CSV.`),
  });
}

function periodKey(period: Period, row: Row) {
  const vendor = normalise(String(row[period.mapping.vendor] || ""));
  const item = normalise(String(row[period.mapping.item] || ""));
  if (!vendor || !item) return "";
  return `${vendor}|||${item}`;
}

function unitPrice(period: Period, row: Row) {
  const raw = parseNumber(String(row[period.mapping.price] || ""));
  if (raw === null || raw <= 0) return null;

  const quantity = period.mapping.quantity
    ? parseNumber(String(row[period.mapping.quantity] || ""))
    : null;

  // If the chosen column is a line total and a quantity exists, derive unit price.
  const priceColumnIsTotal = /total|amount|value|gross/i.test(period.mapping.price);
  if (priceColumnIsTotal && quantity && quantity > 1) return raw / quantity;

  return raw;
}

export default function PriceCreepCheckerClient() {
  const [before, setBefore] = useState<Period | null>(null);
  const [after, setAfter] = useState<Period | null>(null);
  const [error, setError] = useState("");
  const [comparisonRun, setComparisonRun] = useState(false);
  const beforeInput = useRef<HTMLInputElement>(null);
  const afterInput = useRef<HTMLInputElement>(null);

  const results = useMemo<Comparison[]>(() => {
    if (!before || !after || !comparisonRun) return [];
    if (!before.mapping.vendor || !before.mapping.price || !after.mapping.vendor || !after.mapping.price) return [];

    const beforeMap = new Map<string, { price: number; quantity: number | null; vendor: string; item: string }>();
    for (const row of before.rows) {
      const key = periodKey(before, row);
      if (!key) continue;
      const price = unitPrice(before, row);
      if (price === null) continue;
      const quantity = before.mapping.quantity ? parseNumber(String(row[before.mapping.quantity] || "")) : null;
      if (!beforeMap.has(key)) {
        beforeMap.set(key, {
          price,
          quantity,
          vendor: String(row[before.mapping.vendor] || "").trim(),
          item: String(row[before.mapping.item] || "").trim(),
        });
      }
    }

    const changes: Comparison[] = [];
    for (const row of after.rows) {
      const key = periodKey(after, row);
      if (!key) continue;
      const previous = beforeMap.get(key);
      if (!previous) continue;
      const priceAfter = unitPrice(after, row);
      if (priceAfter === null) continue;

      const quantity = after.mapping.quantity ? parseNumber(String(row[after.mapping.quantity] || "")) : null;
      const changeAbs = priceAfter - previous.price;
      if (previous.price <= 0) continue;
      const changePct = (changeAbs / previous.price) * 100;
      const impact = quantity && quantity > 0 ? changeAbs * quantity : changeAbs;

      changes.push({
        vendor: previous.vendor,
        item: previous.item,
        priceBefore: previous.price,
        priceAfter,
        changePct,
        changeAbs,
        quantity: quantity ?? null,
        impact,
      });
    }

    return changes.sort((a, b) => b.impact - a.impact);
  }, [before, after, comparisonRun]);

  const increases = results.filter((item) => item.changePct > 0.5);
  const totalImpact = increases.reduce((sum, item) => sum + item.impact, 0);
  const ready = Boolean(before && after && before.mapping.vendor && before.mapping.price && after.mapping.vendor && after.mapping.price);

  function reset() {
    setBefore(null);
    setAfter(null);
    setComparisonRun(false);
    setError("");
  }

  return (
    <div>
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        {[
          { label: "Earlier period", period: before, input: beforeInput, open: () => beforeInput.current?.click(), onChange: (file: File | null) => file && loadPeriod(file, "Earlier period", setBefore, setError) },
          { label: "Later period", period: after, input: afterInput, open: () => afterInput.current?.click(), onChange: (file: File | null) => file && loadPeriod(file, "Later period", setAfter, setError) },
        ].map((slot) => (
          <div
            key={slot.label}
            className="instant-drop"
            style={{ padding: "30px 22px" }}
            role="button"
            tabIndex={0}
            onClick={slot.open}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") slot.open();
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              slot.onChange(event.dataTransfer.files?.[0] || null);
            }}
          >
            <input
              ref={slot.input}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(event) => slot.onChange(event.target.files?.[0] || null)}
            />
            <div style={{ fontSize: "16px", fontWeight: 900 }}>{slot.label}</div>
            {slot.period ? (
              <>
                <div style={{ marginTop: "8px", color: "#86efac", fontWeight: 800 }}>{slot.period.fileName}</div>
                <div style={{ marginTop: "4px", color: "#94a3b8", fontSize: "13px" }}>{slot.period.rows.length} rows</div>
              </>
            ) : (
              <p style={{ marginTop: "8px", color: "#94a3b8", lineHeight: 1.6 }}>Drop a CSV export with vendor, item and unit price.</p>
            )}
          </div>
        ))}
      </div>

      {error ? <div className="instant-error">{error}</div> : null}

      {before && after ? (
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {[
              ["Vendor column", "vendor", before, setBefore],
              ["Item column", "item", before, setBefore],
              ["Price column", "price", before, setBefore],
            ].map(([label, field, period, setter]: any) => (
              <div key={label}>
                <label className="tool-label" htmlFor={`map-${field}`}>{label}</label>
                <select
                  id={`map-${field}`}
                  className="tool-select"
                  value={period.mapping[field as keyof Mapping]}
                  onChange={(event) => {
                    const value = event.target.value;
                    setter({ ...period, mapping: { ...period.mapping, [field]: value } });
                  }}
                >
                  <option value="">Select…</option>
                  {period.headers.map((header: string) => <option key={header} value={header}>{header}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="primary-button"
            style={{ marginTop: "18px", padding: "14px 24px" }}
            onClick={() => setComparisonRun(true)}
            disabled={!ready}
          >
            Compare prices
          </button>

          {comparisonRun && results.length === 0 ? (
            <p style={{ marginTop: "20px", color: "#cbd5e1", lineHeight: 1.7 }}>
              No matching vendor and item pairs were found between the two files. Check the column mapping, or make sure
              both exports use the same vendor and item wording.
            </p>
          ) : null}

          {comparisonRun && results.length > 0 ? (
            <>
              <div className="instant-stats" style={{ marginTop: "22px" }}>
                {[
                  ["Matched items", String(results.length)],
                  ["Price increases", String(increases.length)],
                  ["Largest increase", increases[0] ? `${increases[0].changePct.toFixed(1)}%` : "—"],
                  ["Estimated impact", money(totalImpact)],
                ].map(([label, value]) => (
                  <div key={label} className="instant-stat">
                    <div className="instant-stat-label">{label}</div>
                    <div className="instant-stat-value">{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
                {increases.slice(0, 15).map((item, index) => (
                  <div key={`${item.vendor}-${item.item}-${index}`} className="instant-finding">
                    <div className="instant-finding-top">
                      <span className="instant-badge instant-badge-high">{item.changePct.toFixed(1)}% up</span>
                      <span className="instant-finding-category">{item.vendor}</span>
                      <span className="instant-finding-amount">{money(item.impact)}</span>
                    </div>
                    <h4 style={{ fontSize: "17px" }}>{item.item}</h4>
                    <p>
                      {money(item.priceBefore)} → {money(item.priceAfter)}
                      {item.quantity ? ` · quantity ${item.quantity}` : ""}
                    </p>
                    <div className="instant-finding-meta">
                      Impact is a review estimate, not a confirmed recovering amount. Confirm the contract, scope or
                      quantity change before treating the increase as overcharging.
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="instant-paywall" style={{ marginTop: "30px" }}>
        <div>
          <p className="eyebrow" style={{ color: "#c7d2fe" }}>What this tool cannot see</p>
          <h3 style={{ fontSize: "24px", fontWeight: 950, marginTop: "8px" }}>
            A price increase is not automatically overcharging
          </h3>
          <p style={{ color: "#cbd5e1", marginTop: "10px", lineHeight: 1.7 }}>
            A justified increase, a scope change or a different quantity can look identical in two exports. Effluxa
            compares vendor identity, invoice references, dates and amounts together, and shows the evidence behind
            each finding so a person can decide.
          </p>
        </div>
        <div className="instant-paywall-actions">
          <Link href="/instant">
            <button className="primary-button" style={{ width: "100%", padding: "16px 22px" }}>Run the full free check</button>
          </Link>
          <Link href="/signup?plan=full_audit">
            <button className="primary-button" style={{ width: "100%", padding: "16px 22px", background: "rgba(255,255,255,0.055)", border: "1px solid rgba(148,163,184,0.28)" }}>
              Unlock a full audit — €149
            </button>
          </Link>
        </div>
      </div>

      {before || after ? (
        <button type="button" className="instant-ghost" style={{ marginTop: "16px" }} onClick={reset}>
          Start over
        </button>
      ) : null}
    </div>
  );
}
