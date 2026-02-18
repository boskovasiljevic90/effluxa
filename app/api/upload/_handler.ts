import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import JSZip from "jszip";
import { parseTabular } from "../../../lib/parse-tabular";
import { pdfToText, pdfInvoiceTextToRows } from "../../../lib/parse-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "invoices" | "payments" | "price-list";

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function isTabularExt(ext: string) {
  return ["csv", "tsv", "xlsx", "xls"].includes(ext);
}

function isPdfExt(ext: string) {
  return ext === "pdf";
}

function isZipExt(ext: string) {
  return ext === "zip";
}

function pickCurrency(raw: any) {
  const c =
    raw?.currency ??
    raw?.Currency ??
    raw?.CURRENCY ??
    raw?.invoice_currency ??
    raw?.INVOICE_CURRENCY ??
    raw?.InvoiceCurrency ??
    raw?.currency_code ??
    null;

  if (!c) return null;
  const s = String(c).trim();
  if (!s) return null;
  return s.toUpperCase();
}

function toNumber(x: any) {
  if (x == null) return null;
  const s = String(x).replace(/\s/g, "").replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toDateString(x: any) {
  if (!x) return null;
  const s = String(x).trim();
  return s || null;
}

function mapInvoiceRow(raw: any) {
  const invoiceNo =
    raw?.invoice_no ??
    raw?.invoice_number ??
    raw?.InvoiceNo ??
    raw?.InvoiceNumber ??
    raw?.INVOICE_NO ??
    raw?.INVOICE_NUMBER ??
    raw?.number ??
    raw?.Number ??
    raw?.INVOICE ??
    null;

  const invoiceDate =
    raw?.invoice_date ??
    raw?.InvoiceDate ??
    raw?.INVOICE_DATE ??
    raw?.date ??
    raw?.Date ??
    null;

  const vendor =
    raw?.vendor ??
    raw?.Vendor ??
    raw?.VENDOR ??
    raw?.supplier ??
    raw?.Supplier ??
    raw?.SUPPLIER ??
    null;

  const total =
    raw?.total ??
    raw?.Total ??
    raw?.TOTAL ??
    raw?.amount ??
    raw?.Amount ??
    raw?.AMOUNT ??
    raw?.total_due ??
    raw?.TotalDue ??
    raw?.TOTAL_DUE ??
    null;

  const currency = pickCurrency(raw);

  return {
    invoiceNo: invoiceNo ? String(invoiceNo).trim() : null,
    invoiceDate: toDateString(invoiceDate),
    vendor: vendor ? String(vendor).trim() : null,
    total: toNumber(total),
    currency,
  };
}

function mapPaymentRow(raw: any) {
  const paymentRef =
    raw?.payment_ref ??
    raw?.PaymentRef ??
    raw?.PAYMENT_REF ??
    raw?.reference ??
    raw?.Reference ??
    raw?.REF ??
    null;

  const paymentDate =
    raw?.payment_date ??
    raw?.PaymentDate ??
    raw?.PAYMENT_DATE ??
    raw?.date ??
    raw?.Date ??
    null;

  const amount =
    raw?.payment_amount ??
    raw?.PaymentAmount ??
    raw?.PAYMENT_AMOUNT ??
    raw?.amount ??
    raw?.Amount ??
    raw?.AMOUNT ??
    null;

  const currency = pickCurrency(raw);

  return {
    paymentRef: paymentRef ? String(paymentRef).trim() : null,
    paymentDate: toDateString(paymentDate),
    amount: toNumber(amount),
    currency,
  };
}

function mapPriceRow(raw: any) {
  const sku = raw?.sku ?? raw?.SKU ?? raw?.Sku ?? raw?.item ?? raw?.Item ?? null;
  const name = raw?.name ?? raw?.Name ?? raw?.product ?? raw?.Product ?? null;
  const price = raw?.price ?? raw?.Price ?? raw?.unit_price ?? raw?.UnitPrice ?? null;
  const currency = pickCurrency(raw);

  return {
    sku: sku ? String(sku).trim() : null,
    name: name ? String(name).trim() : null,
    price: toNumber(price),
    currency,
  };
}

async function parseSingleFile(kind: Kind, fileName: string, buf: Buffer) {
  const ext = extOf(fileName);

  // ZIP
  if (isZipExt(ext)) {
    const zip = await JSZip.loadAsync(buf);
    const out: { filename: string; rows: any[] }[] = [];

    const entries = Object.values(zip.files).filter((f) => !f.dir);

    for (const entry of entries) {
      const innerName = entry.name;
      const innerExt = extOf(innerName);

      const innerBuf = Buffer.from(await entry.async("uint8array"));

      // invoices: PDF + tabular
      if (kind === "invoices") {
        if (isPdfExt(innerExt)) {
          const text = await pdfToText(innerBuf);
          const rows = pdfInvoiceTextToRows(text);
          out.push({ filename: innerName, rows });
          continue;
        }
      }

      // tabular for all kinds
      if (isTabularExt(innerExt)) {
        const rows = await parseTabular(innerBuf, innerName);
        out.push({ filename: innerName, rows });
      }
    }

    return out;
  }

  // PDF (only invoices)
  if (kind === "invoices" && isPdfExt(ext)) {
    const text = await pdfToText(buf);
    const rows = pdfInvoiceTextToRows(text);
    return [{ filename: fileName, rows }];
  }

  // tabular
  if (isTabularExt(ext)) {
    const rows = await parseTabular(buf, fileName);
    return [{ filename: fileName, rows }];
  }

  // unsupported
  return [];
}

export async function handleUpload(req: Request, kind: Kind) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Missing organization" }, { status: 400 });

    const url = new URL(req.url);
    const replace = url.searchParams.get("replace") === "1";

    const form = await req.formData();
    const f = form.get("file");

    if (!f || !(f instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buf = Buffer.from(await f.arrayBuffer());

    // IMPORTANT: orgId in DB is Clerk orgId (string). No prisma.organization lookup.
    const batch = await prisma.uploadBatch.create({
      data: {
        orgId,
        kind,
        filename: f.name || "upload",
        replace,
      },
    });

    if (replace) {
      if (kind === "invoices") await prisma.invoiceRow.deleteMany({ where: { orgId } });
      if (kind === "payments") await prisma.paymentRow.deleteMany({ where: { orgId } });
      if (kind === "price-list") await prisma.priceListRow.deleteMany({ where: { orgId } });
    }

    const parsedFiles = await parseSingleFile(kind, f.name || "upload", buf);

    if (!parsedFiles.length) {
      return NextResponse.json(
        { error: "Unsupported file type", message: "Accepted: CSV/TSV/XLS/XLSX/ZIP (and PDF for invoices)." },
        { status: 400 }
      );
    }

    const batches: any[] = [];

    for (const pf of parsedFiles) {
      if (!pf.rows?.length) continue;

      await prisma.parsedFile.create({
        data: {
          orgId,
          batchId: batch.id,
          filename: pf.filename,
          rows: pf.rows.length,
          raw: pf.rows as any,
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

    return NextResponse.json({ ok: true, kind, orgId, replace, batches });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", message: e?.message ?? String(e) }, { status: 500 });
  }
}
