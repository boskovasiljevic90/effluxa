import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import JSZip from "jszip";

import { prisma } from "@/lib/prisma";
import { parseTabular } from "@/lib/parse-tabular";
import { pdfToText, pdfInvoiceTextToRows } from "@/lib/parse-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "invoices" | "payments" | "price-list";

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function normKey(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[\s\-_#()]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function pickKey(row: Record<string, any>, patterns: RegExp[]) {
  const keys = Object.keys(row || {});
  for (const k of keys) {
    const nk = normKey(k);
    for (const p of patterns) {
      if (p.test(nk)) return k;
    }
  }
  return null;
}

function toText(v: any) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function toNumberLike(v: any) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;

  const s0 = String(v).trim();
  if (!s0) return null;

  // keep digits, dot, comma, minus
  const s1 = s0.replace(/[^\d,.\-]/g, "");

  const lastComma = s1.lastIndexOf(",");
  const lastDot = s1.lastIndexOf(".");

  let s2 = s1;

  // both comma and dot exist: decide decimal separator by last occurrence
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) s2 = s1.replace(/\./g, "").replace(",", ".");
    else s2 = s1.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // only comma: treat as decimal, remove thousand dots
    s2 = s1.replace(/\./g, "").replace(",", ".");
  } else {
    // only dot or none: remove thousand commas
    s2 = s1.replace(/,/g, "");
  }

  const n = Number(s2);
  return Number.isFinite(n) ? n : null;
}

function toDateSmart(v: any) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  // Excel numeric date might already be converted by xlsx; if it's a string/number like 23012026 -> ddmmyyyy
  const raw = typeof v === "number" ? String(v) : String(v).trim();

  // 8 digits special-case: 23012026 or 20260123
  if (/^\d{8}$/.test(raw)) {
    const a = Number(raw.slice(0, 4));
    const b = Number(raw.slice(4, 6));
    const c = Number(raw.slice(6, 8));

    // yyyymmdd
    if (a >= 1900 && a <= 2100 && b >= 1 && b <= 12 && c >= 1 && c <= 31) {
      const d = new Date(Date.UTC(a, b - 1, c));
      return isNaN(d.getTime()) ? null : d;
    }

    // ddmmyyyy
    const dd = Number(raw.slice(0, 2));
    const mm = Number(raw.slice(2, 4));
    const yyyy = Number(raw.slice(4, 8));
    if (yyyy >= 1900 && yyyy <= 2100 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * ===== Mapping (tabular rows → Prisma fields) =====
 * Ovo omogućava da korisnik uploaduje razne CSV/XLSX export-e (ne samo template).
 */

function mapInvoiceRow(row: Record<string, any>) {
  const kNo = pickKey(row, [/^invoicen(o|um|umber)$/, /^invno$/, /^invoiceid$/, /^invoice#$/, /^billno$/, /^documentno$/, /^invoice_number$/]);
  const kVendor = pickKey(row, [/^vendor$/, /^supplier$/, /^counterparty$/, /^customer$/, /^company$/, /^seller$/, /^buyer$/]);
  const kRef = pickKey(row, [/^reference$/, /^ref$/, /^description$/, /^memo$/, /^details$/, /^note$/]);
  const kAmt = pickKey(row, [/^amount$/, /^total$/, /^invoicetotal$/, /^grandtotal$/, /^balance$/, /^due$/, /^nettotal$/, /^totaldue$/]);
  const kCur = pickKey(row, [/^currency$/, /^curr$/, /^ccy$/]);
  const kDate = pickKey(row, [/^invoicedate$/, /^date$/, /^issuedate$/, /^billdate$/, /^invoice_date$/]);

  return {
    invoiceNo: kNo ? toText(row[kNo]) : null,
    counterparty: kVendor ? toText(row[kVendor]) : null,
    reference: kRef ? toText(row[kRef]) : null,
    amount: kAmt ? toNumberLike(row[kAmt]) : null,
    currency: kCur ? toText(row[kCur]) : null,
    invoiceDate: kDate ? toDateSmart(row[kDate]) : null,
  };
}

function mapPaymentRow(row: Record<string, any>) {
  const kRef = pickKey(row, [/^reference$/, /^ref$/, /^description$/, /^memo$/, /^details$/, /^note$/, /^paymentreference$/, /^payment_ref$/]);
  const kAmt = pickKey(row, [/^amount$/, /^paid$/, /^paymentamount$/, /^total$/, /^value$/]);
  const kCur = pickKey(row, [/^currency$/, /^curr$/, /^ccy$/]);
  const kDate = pickKey(row, [/^paymentdate$/, /^date$/, /^valuedate$/, /^posteddate$/, /^transactiondate$/, /^payment_date$/]);
  const kVendor = pickKey(row, [/^vendor$/, /^supplier$/, /^counterparty$/, /^customer$/, /^company$/]);

  const refText = kRef ? toText(row[kRef]) : null;

  return {
    paymentRef: refText,
    reference: refText,
    counterparty: kVendor ? toText(row[kVendor]) : null,
    amount: kAmt ? toNumberLike(row[kAmt]) : null,
    currency: kCur ? toText(row[kCur]) : null,
    paymentDate: kDate ? toDateSmart(row[kDate]) : null,
  };
}

function mapPriceRow(row: Record<string, any>) {
  const kSku = pickKey(row, [/^sku$/, /^item$/, /^itemcode$/, /^productcode$/, /^code$/]);
  const kName = pickKey(row, [/^name$/, /^product$/, /^description$/, /^itemname$/]);
  const kPrice = pickKey(row, [/^unitprice$/, /^unit_price$/, /^price$/, /^amount$/, /^rate$/]);
  const kCur = pickKey(row, [/^currency$/, /^curr$/, /^ccy$/]);
  const kVendor = pickKey(row, [/^vendor$/, /^supplier$/, /^counterparty$/, /^company$/]);

  return {
    vendor: kVendor ? toText(row[kVendor]) : null,
    sku: kSku ? toText(row[kSku]) : null,
    name: kName ? toText(row[kName]) : null,
    unitPrice: kPrice ? toNumberLike(row[kPrice]) : null,
    currency: kCur ? toText(row[kCur]) : null,
  };
}

async function deleteExistingForKind(orgId: string, kind: Kind) {
  if (kind === "invoices") {
    await prisma.invoiceRow.deleteMany({ where: { orgId } });
    await prisma.reconcileResult.deleteMany({ where: { orgId } });
    await prisma.reconcileRun.deleteMany({ where: { orgId } });
  }
  if (kind === "payments") {
    await prisma.paymentRow.deleteMany({ where: { orgId } });
    await prisma.reconcileResult.deleteMany({ where: { orgId } });
    await prisma.reconcileRun.deleteMany({ where: { orgId } });
  }
  if (kind === "price-list") {
    await prisma.priceListRow.deleteMany({ where: { orgId } });
  }
}

/**
 * Process one logical file (already in memory) into rows.
 * Returns parsed rows + original raw filename.
 */
async function parseOne(kind: Kind, filename: string, buffer: Buffer): Promise<{ filename: string; rows: Record<string, any>[] }> {
  const ext = extOf(filename);

  if (ext === "pdf") {
    if (kind !== "invoices") {
      throw new Error("PDF upload is currently supported only for invoices.");
    }
    const text = await pdfToText(buffer);
    const rows = pdfInvoiceTextToRows(text);
    return { filename, rows };
  }

  // CSV/TSV/XLSX/XLS
  const rows = await parseTabular(buffer, filename);
  return { filename, rows };
}

async function parseZip(kind: Kind, zipName: string, buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const files: { filename: string; rows: Record<string, any>[] }[] = [];

  const entries = Object.values(zip.files).filter((f) => !f.dir);
  for (const e of entries) {
    const name = e.name.split("/").pop() || e.name;
    const ext = extOf(name);
    if (!["csv", "tsv", "xlsx", "xls", "pdf"].includes(ext)) continue;

    const buf = Buffer.from(await e.async("nodebuffer"));
    const parsed = await parseOne(kind, name, buf);
    files.push(parsed);
  }

  if (!files.length) {
    throw new Error(`ZIP "${zipName}" contained no supported files (csv/tsv/xlsx/xls/pdf).`);
  }

  return files;
}

export async function handleUpload(req: Request, kind: Kind) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) {
      return NextResponse.json(
        { error: "Missing org", hint: "Switch from Personal to an Organization (top-right) and retry." },
        { status: 400 }
      );
    }

    const form = await req.formData();

    // replace mode: briše postojeće redove te vrste pre upisa
    const replace = String(form.get("replace") ?? "").trim() === "1";
    if (replace) await deleteExistingForKind(orgId, kind);

    // multi-upload: prihvatamo "file" i "files"
    const all = [
      ...form.getAll("file"),
      ...form.getAll("files"),
    ].filter(Boolean);

    if (!all.length) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const fileObjs = all.filter((x) => x instanceof File) as File[];
    if (!fileObjs.length) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const batches: any[] = [];

    for (const file of fileObjs) {
      const buf = Buffer.from(await file.arrayBuffer());
      const ext = extOf(file.name);

      let parsedFiles: { filename: string; rows: Record<string, any>[] }[] = [];

      if (ext === "zip") {
        parsedFiles = await parseZip(kind, file.name, buf);
      } else {
        parsedFiles = [await parseOne(kind, file.name, buf)];
      }

      // Svaki ulazni fajl dobija svoj batch (ZIP: jedan batch po svakom fajlu iz ZIP-a)
      for (const pf of parsedFiles) {
        if (!pf.rows || pf.rows.length === 0) {
          throw new Error(`No rows found in file "${pf.filename}".`);
        }

        const batch = await prisma.uploadBatch.create({
          data: {
            orgId,
            kind,
            filename: pf.filename,
          },
        });

        if (kind === "invoices") {
          const data = pf.rows.map((r: any) => ({
            orgId,
            batchId: batch.id,
            raw: r,
            ...mapInvoiceRow(r),
          }));
          await prisma.invoiceRow.createMany({ data });
        }

        if (kind === "payments") {
          const data = pf.rows.map((r: any) => ({
            orgId,
            batchId: batch.id,
            raw: r,
            ...mapPaymentRow(r),
          }));
          await prisma.paymentRow.createMany({ data });
        }

        if (kind === "price-list") {
          const data = pf.rows.map((r: any) => ({
            orgId,
            batchId: batch.id,
            raw: r,
            ...mapPriceRow(r),
          }));
          await prisma.priceListRow.createMany({ data });
        }

        const headersDetected = Object.keys(pf.rows[0] || {});
        batches.push({
          batchId: batch.id,
          filename: pf.filename,
          rows: pf.rows.length,
          headersDetected,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      kind,
      orgId,
      replace,
      batches,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
