import * as path from "path";
import { pathToFileURL } from "url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Turbopack dev fix:
 * pdfjs pokušava da učita worker iz .next/.../chunks. Mi ga forsiramo na node_modules fajl.
 */
function ensurePdfWorker() {
  const anyPdf: any = pdfjs as any;
  if (!anyPdf?.GlobalWorkerOptions) return;

  const workerFsPath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs");
  anyPdf.GlobalWorkerOptions.workerSrc = pathToFileURL(workerFsPath).toString();
}

export async function pdfToText(buffer: Buffer): Promise<string> {
  ensurePdfWorker();

  const loadingTask = (pdfjs as any).getDocument({
    data: new Uint8Array(buffer),
  });

  const doc = await loadingTask.promise;

  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items || []).map((it: any) => (it && it.str ? String(it.str) : ""));
    out += strings.join(" ") + "\n";
  }
  return out.trim();
}

/**
 * Minimal extraction (MVP) iz PDF teksta → jedan "row" koji se dalje mapira kao da je tabular.
 * Sve čuvamo u _pdf_text (raw) da kasnije AI može da radi bolju ekstrakciju.
 */
export function pdfInvoiceTextToRows(text: string): Record<string, any>[] {
  const t = text.replace(/\s+/g, " ").trim();

  const invoiceNumber =
    matchFirst(t, [
      /Invoice\s*(Number|No\.?|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
      /\bINV[-\s]?(\d{3,})\b/i,
    ]) ?? null;

  const invoiceDate =
    matchFirst(t, [
      /Invoice\s*Date\s*[:\-]?\s*([A-Za-z]{3,}\s+\d{1,2},\s+\d{4})/i,
      /Invoice\s*Date\s*[:\-]?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
      /\b(\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})\b/i,
    ]) ?? null;

  const totalRaw =
    matchFirst(t, [
      /Total\s*Due\s*[:\-]?\s*([$€£]?\s?\d[\d,]*[\.]\d{2})/i,
      /Total\s*[:\-]?\s*([$€£]?\s?\d[\d,]*[\.]\d{2})/i,
      /Amount\s*Due\s*[:\-]?\s*([$€£]?\s?\d[\d,]*[\.]\d{2})/i,
    ]) ?? null;

  const currency =
    matchFirst(t, [
      /\b(RSD|EUR|USD|GBP|CHF|AED|SAR|AUD|CAD)\b/i,
      /([$€£])/,
    ]) ?? null;

  const row: Record<string, any> = {
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    total: totalRaw,
    currency: normalizeCurrency(currency),
    _pdf_text: text.slice(0, 20000),
  };

  return [row];
}

function matchFirst(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const val = (m.length >= 3 ? m[2] : m[1]) ?? null;
    if (val) return String(val).trim();
  }
  return null;
}

function normalizeCurrency(cur: string | null): string | null {
  if (!cur) return null;
  const c = String(cur).trim();
  if (c === "$") return "USD";
  if (c === "€") return "EUR";
  if (c === "£") return "GBP";
  const up = c.toUpperCase();
  if (/^[A-Z]{3}$/.test(up)) return up;
  return up;
}
