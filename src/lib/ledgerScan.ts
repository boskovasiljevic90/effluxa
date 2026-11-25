import type { AuditFinding, Evidence } from "@/lib/audit-v2/types";
import { createFinding } from "@/lib/audit-v2/rules/common";

/**
 * Deterministic ledger scan for delimited text (CSV / TSV / spreadsheet text).
 *
 * The AI extraction pass occasionally collapses two identical invoice rows into
 * one record, which is exactly the failure that hides a duplicate payment. This
 * scan reads the raw rows and re-checks duplicate logic with no model involved,
 * so duplicate detection never depends on model transcription behaviour.
 */

const VENDOR_HINTS = ["vendor", "supplier", "payee", "merchant", "creditor", "name"];
const INVOICE_HINTS = ["invoice", "inv no", "reference", "ref", "bill", "document"];
const DATE_HINTS = ["invoice date", "date", "posting", "value date", "due"];
const AMOUNT_HINTS = ["amount", "total", "gross", "value", "debit"];

const MAX_ROWS = 8000;
const MAX_FINDINGS = 25;

type ParsedRow = {
  line: number;
  vendor: string;
  invoice: string;
  date: Date | null;
  amount: number | null;
};

function pickDelimiter(header: string) {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = header.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return bestCount > 0 ? best : null;
}

function splitRow(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }
      quoted = !quoted;
      continue;
    }
    if (character === delimiter && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += character;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

function parseAmount(value: string) {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\d.,-]/g, "")
    .replace(/(\d)\.(\d{3})(?=\D|$)/g, "$1$2")
    .replace(",", ".");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  const absolute = Math.abs(parsed);
  return absolute > 0 ? absolute : null;
}

function parseDate(value: string) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const european = value.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (european) {
    const year = european[3].length === 2 ? Number(`20${european[3]}`) : Number(european[3]);
    const date = new Date(Date.UTC(year, Number(european[2]) - 1, Number(european[1])));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function findColumn(headers: string[], hints: string[], fallbackIndex = -1) {
  const lowered = headers.map((header) => header.toLowerCase());
  for (const hint of hints) {
    const index = lowered.findIndex((header) => header.includes(hint));
    if (index >= 0) return index;
  }
  return fallbackIndex;
}

function evidence(row: ParsedRow, source: string, detail: string): Evidence {
  return {
    source,
    page: null,
    row: row.line,
    sheet: null,
    date: row.date ? row.date.toISOString().slice(0, 10) : null,
    vendor: row.vendor || null,
    invoice: row.invoice || null,
    amount: row.amount,
    detail,
  };
}

function normaliseVendor(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function normaliseInvoice(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function scanLedgerRows({
  financialText,
  fileName,
}: {
  financialText: string;
  fileName: string;
}): AuditFinding[] {
  if (!financialText || financialText.length < 40) return [];

  const lines = financialText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 3) return [];

  // Header may not be the first line in spreadsheet exports.
  let headerIndex = -1;
  let delimiter: string | null = null;
  for (let index = 0; index < Math.min(10, lines.length); index += 1) {
    const candidate = lines[index];
    const lowered = candidate.toLowerCase();
    const matches = [VENDOR_HINTS, INVOICE_HINTS, AMOUNT_HINTS].filter((hints) =>
      hints.some((hint) => lowered.includes(hint))
    ).length;
    if (matches >= 2) {
      const candidateDelimiter = pickDelimiter(candidate);
      if (candidateDelimiter) {
        headerIndex = index;
        delimiter = candidateDelimiter;
        break;
      }
    }
  }

  if (headerIndex < 0 || !delimiter) return [];

  const headers = splitRow(lines[headerIndex], delimiter!);
  const vendorCol = findColumn(headers, VENDOR_HINTS);
  const invoiceCol = findColumn(headers, INVOICE_HINTS);
  const dateCol = findColumn(headers, DATE_HINTS);
  const amountCol = findColumn(headers, AMOUNT_HINTS);

  if (vendorCol < 0 || amountCol < 0) return [];

  const rows: ParsedRow[] = [];
  for (let index = headerIndex + 1; index < lines.length && rows.length < MAX_ROWS; index += 1) {
    const cells = splitRow(lines[index], delimiter!);
    const vendor = (cells[vendorCol] || "").trim();
    const amount = parseAmount(cells[amountCol] || "");
    if (!vendor || !amount || vendor.length < 2) continue;

    rows.push({
      line: index + 1,
      vendor,
      invoice: invoiceCol >= 0 ? (cells[invoiceCol] || "").trim() : "",
      date: dateCol >= 0 ? parseDate(cells[dateCol] || "") : null,
      amount,
    });
  }

  if (rows.length < 2) return [];

  const source = fileName || "Uploaded ledger";
  const findings: AuditFinding[] = [];

  // Exact duplicates: same vendor + invoice reference + amount.
  const exactGroups = new Map<string, ParsedRow[]>();
  for (const row of rows) {
    if (!row.invoice) continue;
    const key = `${normaliseVendor(row.vendor)}|${normaliseInvoice(row.invoice)}|${row.amount!.toFixed(2)}`;
    const bucket = exactGroups.get(key);
    if (bucket) bucket.push(row);
    else exactGroups.set(key, [row]);
  }

  for (const bucket of exactGroups.values()) {
    if (bucket.length < 2 || findings.length >= MAX_FINDINGS) continue;
    const first = bucket[0];
    findings.push(
      createFinding({
        ruleId: "LEDGER_EXACT_DUPLICATE",
        category: "DUPLICATE_PAYMENT",
        title: "Duplicate invoice rows in the source file",
        severity: "CRITICAL",
        confidence: 0.98,
        description: `${bucket.length} ledger rows share the same vendor, invoice reference and amount. This is a row-level duplicate in the uploaded file, independent of any AI reading.`,
        evidence: bucket.map((row) => evidence(row, source, "Matching vendor, invoice reference and amount.")),
        amount: first.amount,
        currency: "EUR",
        quantificationType: "POTENTIAL_DUPLICATE",
        recommendedAction:
          "Check payment status and credit notes for these rows before paying again. Treat it as a duplicate only after the source documents confirm it.",
      })
    );
  }

  // Near duplicates: same vendor, amount within 1%, different reference, dates within 45 days.
  const byVendor = new Map<string, ParsedRow[]>();
  for (const row of rows) {
    const key = normaliseVendor(row.vendor);
    const bucket = byVendor.get(key);
    if (bucket) bucket.push(row);
    else byVendor.set(key, [row]);
  }

  const nearKeys = new Set<string>();
  for (const bucket of byVendor.values()) {
    if (bucket.length < 2 || bucket.length > 500) continue;

    for (let i = 0; i < bucket.length && findings.length < MAX_FINDINGS; i += 1) {
      for (let j = i + 1; j < bucket.length && findings.length < MAX_FINDINGS; j += 1) {
        const first = bucket[i];
        const second = bucket[j];
        if (!first.amount || !second.amount) continue;
        // Compare in integer cents: float subtraction at the 1% boundary
        // rejects valid near-duplicates such as 860.00 vs 868.60.
        const diffCents = Math.abs(Math.round(first.amount * 100) - Math.round(second.amount * 100));
        const limitCents = Math.max(100, Math.round(first.amount * 100 * 0.01));
        if (diffCents > limitCents) continue;

        const firstInvoice = normaliseInvoice(first.invoice);
        const secondInvoice = normaliseInvoice(second.invoice);
        if (firstInvoice && firstInvoice === secondInvoice) continue;

        if (first.date && second.date) {
          const days = Math.abs(first.date.getTime() - second.date.getTime()) / 86_400_000;
          if (days > 45) continue;
        }

        const key = `${normaliseVendor(first.vendor)}|${first.amount.toFixed(2)}|${first.line}|${second.line}`;
        if (nearKeys.has(key)) continue;
        nearKeys.add(key);

        findings.push(
          createFinding({
            ruleId: "LEDGER_NEAR_DUPLICATE",
            category: "DUPLICATE_PAYMENT",
            title: "Possible near-duplicate invoice",
            severity: "HIGH",
            confidence: 0.82,
            description:
              "Two ledger rows share the same vendor and an amount within 1%, with a different invoice reference. This is a review signal, not a confirmed duplicate.",
            evidence: [
              evidence(first, source, "First row in the matching pair."),
              evidence(second, source, "Second row in the matching pair."),
            ],
            amount: first.amount,
            currency: "EUR",
            quantificationType: "POTENTIAL_DUPLICATE",
            recommendedAction:
              "Compare the two invoices, the delivery evidence and the payment status before releasing payment.",
          })
        );
      }
    }
  }

  return findings;
}

/**
 * Merge deterministic scan findings without duplicating what the rule engine
 * already reported for the same vendor, invoice and amount.
 */
export function mergeLedgerFindings(existing: AuditFinding[], scanned: AuditFinding[]) {
  if (scanned.length === 0) return existing;

  const seen = new Set<string>();
  for (const finding of existing) {
    for (const item of finding.evidence) {
      seen.add(
        `${(item.vendor || "").toLowerCase()}|${(item.invoice || "").toLowerCase()}|${item.amount ?? ""}`
      );
    }
  }

  const additions = scanned.filter((finding) =>
    finding.evidence.every((item) => {
      const key = `${(item.vendor || "").toLowerCase()}|${(item.invoice || "").toLowerCase()}|${item.amount ?? ""}`;
      return !seen.has(key);
    })
  );

  return [...existing, ...additions];
}
