import { NextResponse } from "next/server";
import { parseTabular } from "@/lib/parse-tabular";
import { parsePdfInvoice } from "@/lib/parse-pdf-invoice";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromRequest } from "@/lib/auth";
import { ensureOrg } from "@/lib/org";
import { enforceWeeklyFreeLimit } from "@/lib/subscription";
import { normalizeInvoiceRaw, normalizePaymentRaw, normalizePriceListRaw } from "@/lib/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "invoices" | "payments" | "price-list";

async function readMultipartFiles(req: Request): Promise<{ filename: string; buffer: Buffer }[]> {
  const form = await req.formData();
  const files = form.getAll("file").filter(Boolean) as File[];
  const out: { filename: string; buffer: Buffer }[] = [];

  for (const f of files) {
    const ab = await f.arrayBuffer();
    out.push({ filename: f.name || "upload.bin", buffer: Buffer.from(ab) });
  }
  return out;
}

export async function handleUpload(req: Request, kind: Kind) {
  try {
    const orgId = getOrgIdFromRequest(req);
    await ensureOrg(orgId);

    // FREE plan weekly limit: 1 upload per kind per week
    await enforceWeeklyFreeLimit(orgId, kind);

    const url = new URL(req.url);
    const replace = url.searchParams.get("replace") === "1";

    const files = await readMultipartFiles(req);
    if (!files.length) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Create batch per request (keep simple)
    const batch = await prisma.uploadBatch.create({
      data: {
        orgId,
        kind,
        filename: files.length === 1 ? files[0].filename : `${kind}-${files.length}-files`,
      },
    });

    if (replace) {
      if (kind === "invoices") await prisma.invoiceRow.deleteMany({ where: { orgId } });
      if (kind === "payments") await prisma.paymentRow.deleteMany({ where: { orgId } });
      if (kind === "price-list") await prisma.priceListRow.deleteMany({ where: { orgId } });
    }

    let totalRows = 0;

    for (const f of files) {
      const name = f.filename.toLowerCase();

      let rows: any[] = [];

      if (kind === "invoices" && name.endsWith(".pdf")) {
        const extracted = await parsePdfInvoice(f.buffer);
        rows = extracted ? [extracted] : [];
      } else {
        rows = (await parseTabular(f.buffer, f.filename)) || [];
      }

      if (!rows.length) continue;

      if (kind === "invoices") {
        const data = rows.map((r) => ({
          orgId,
          batchId: batch.id,
          raw: normalizeInvoiceRaw(r),
        }));
        await prisma.invoiceRow.createMany({ data });
        totalRows += data.length;
      }

      if (kind === "payments") {
        const data = rows.map((r) => ({
          orgId,
          batchId: batch.id,
          raw: normalizePaymentRaw(r),
        }));
        await prisma.paymentRow.createMany({ data });
        totalRows += data.length;
      }

      if (kind === "price-list") {
        const data = rows.map((r) => ({
          orgId,
          batchId: batch.id,
          raw: normalizePriceListRaw(r),
        }));
        await prisma.priceListRow.createMany({ data });
        totalRows += data.length;
      }
    }

    return NextResponse.json({
      success: true,
      kind,
      batchId: batch.id,
      rowsInserted: totalRows,
      message: `${kind} upload working`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
