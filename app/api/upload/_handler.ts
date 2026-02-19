import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { parseTabular } from "../../../lib/parse-tabular";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "invoices" | "payments" | "price-list";

async function extractFiles(formData: FormData) {
  const files: File[] = [];
  for (const value of formData.values()) {
    if (value instanceof File) files.push(value);
  }
  return files;
}

export async function handleUpload(req: Request, kind: Kind) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Missing organization" }, { status: 400 });
    }

    const form = await req.formData();
    const files = await extractFiles(form);

    if (!files.length) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const batches = [];

    for (const f of files) {
      const batch = await prisma.uploadBatch.create({
        data: {
          orgId,
          kind,
          filename: f.name || "upload"
        }
      });

      const buffer = Buffer.from(await f.arrayBuffer());

      const rows = await parseTabular(buffer, f.name);

      if (!rows || !rows.length) continue;

      if (kind === "invoices") {
        await prisma.invoiceRow.createMany({
          data: rows.map((r: any) => ({
            orgId,
            batchId: batch.id,
            raw: r,
            invoiceNo: r.invoice_number || null,
            amount: r.total || null,
            currency: r.currency || null,
            invoiceDate: r.invoice_date ? new Date(r.invoice_date) : null
          }))
        });
      }

      if (kind === "payments") {
        await prisma.paymentRow.createMany({
          data: rows.map((r: any) => ({
            orgId,
            batchId: batch.id,
            raw: r,
            reference: r.reference || null,
            amount: r.amount || null,
            currency: r.currency || null,
            paymentDate: r.payment_date ? new Date(r.payment_date) : null
          }))
        });
      }

      if (kind === "price-list") {
        await prisma.priceListRow.createMany({
          data: rows.map((r: any) => ({
            orgId,
            batchId: batch.id,
            raw: r,
            sku: r.sku || null,
            name: r.name || null,
            unitPrice: r.price || null,
            currency: r.currency || null
          }))
        });
      }

      batches.push({
        batchId: batch.id,
        filename: f.name,
        rows: rows.length
      });
    }

    return NextResponse.json({
      ok: true,
      kind,
      orgId,
      batches
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
