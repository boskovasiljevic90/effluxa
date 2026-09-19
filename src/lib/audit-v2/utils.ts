import type { Evidence } from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function text(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

export function number(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value !== "string") return fallback;

  let cleaned = value.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return fallback;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const fractionalDigits = cleaned.length - lastComma - 1;
    cleaned = fractionalDigits === 3 ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    cleaned = cleaned.replace(/\./g, "");
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeName(value: unknown) {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function normalizeInvoiceNumber(value: unknown) {
  return normalizeName(value);
}

export function normalizeDate(value: unknown) {
  const raw = text(value);
  if (!raw) return null;

  const direct = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (direct) {
    return `${direct[1]}-${direct[2].padStart(2, "0")}-${direct[3].padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function dayNumber(value: unknown) {
  const normalized = normalizeDate(value);
  if (!normalized) return null;
  const timestamp = Date.parse(`${normalized}T00:00:00Z`);
  return Number.isNaN(timestamp) ? null : timestamp / 86_400_000;
}

export function daysBetween(first: unknown, second: unknown) {
  const firstDay = dayNumber(first);
  const secondDay = dayNumber(second);
  if (firstDay === null || secondDay === null) return null;
  return Math.abs(firstDay - secondDay);
}

export function isBeforeOrSame(first: unknown, second: unknown) {
  const firstDay = dayNumber(first);
  const secondDay = dayNumber(second);
  return firstDay !== null && secondDay !== null && firstDay <= secondDay;
}

export function evidenceFor(
  source: string,
  detail: string,
  values: Partial<Omit<Evidence, "source" | "detail">> = {}
): Evidence {
  return {
    source,
    detail,
    page: values.page ?? null,
    row: values.row ?? null,
    sheet: values.sheet ?? null,
    date: values.date ?? null,
    vendor: values.vendor ?? null,
    invoice: values.invoice ?? null,
    amount: values.amount ?? null,
  };
}

export function rounded(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function finitePositive(value: unknown) {
  const parsed = number(value, 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
