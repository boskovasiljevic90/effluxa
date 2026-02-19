type AnyObj = Record<string, any>;

function pick(obj: AnyObj, keys: string[]) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && String(obj[k]).trim() !== "") return obj[k];
  }
  return undefined;
}

function toNumber(v: any): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/,/g, ".").replace(/[^\d.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toISODate(v: any): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function normalizeInvoiceRaw(raw: AnyObj) {
  return {
    invoiceNumber: pick(raw, ["invoiceNumber", "invoice_no", "invoiceNo", "invoice", "number", "id"]),
    reference: pick(raw, ["reference", "ref", "paymentReference", "memo"]),
    counterparty: pick(raw, ["counterparty", "vendor", "supplier", "customer", "from", "issuer"]),
    currency: pick(raw, ["currency", "ccy"]),
    invoiceDate: toISODate(pick(raw, ["invoiceDate", "date", "issuedAt", "issueDate"])),
    dueDate: toISODate(pick(raw, ["dueDate", "due"])),
    total: toNumber(pick(raw, ["total", "amount", "totalAmount", "gross", "sum"])),
    raw,
  };
}

export function normalizePaymentRaw(raw: AnyObj) {
  return {
    reference: pick(raw, ["reference", "ref", "memo", "paymentReference", "invoiceNumber", "invoice_no", "invoiceNo"]),
    counterparty: pick(raw, ["counterparty", "vendor", "supplier", "customer", "to", "payee"]),
    currency: pick(raw, ["currency", "ccy"]),
    paymentDate: toISODate(pick(raw, ["paymentDate", "date", "paidAt"])),
    amount: toNumber(pick(raw, ["amount", "paid", "value", "sum"])),
    raw,
  };
}

export function normalizePriceListRaw(raw: AnyObj) {
  return {
    item: pick(raw, ["item", "sku", "product", "name", "description"]),
    currency: pick(raw, ["currency", "ccy"]),
    price: toNumber(pick(raw, ["price", "unitPrice", "amount"])),
    raw,
  };
}
