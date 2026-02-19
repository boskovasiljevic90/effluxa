import { prisma } from "@/lib/prisma";
import { parsePdfInvoice } from "@/lib/parse-pdf-invoice";
import { parseTabular } from "@/lib/parse-tabular";
import { getOrgIdFromRequest } from "@/lib/auth";
import { ensureOrg, incrementUsage } from "@/lib/org";

export async function handleUpload(
  req: Request,
  kind: "invoices" | "payments" | "price-list"
) {
  try {
    const orgId = getOrgIdFromRequest(req);
    const org = await ensureOrg(orgId);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    let rows: any[] = [];

    // ===== PDF invoice =====
    if (kind === "invoices" && name.endsWith(".pdf")) {
      const extracted = await parsePdfInvoice(buffer, orgId);
      rows = extracted ? [extracted] : [];
    } else {
      rows = (await parseTabular(buffer, file.name)) || [];
    }

    if (!rows.length) {
      return new Response(
        JSON.stringify({ error: "No rows parsed" }),
        { status: 400 }
      );
    }

    const batch = await prisma.uploadBatch.create({
      data: {
        orgId,
        kind,
        filename: file.name,
      },
    });

    if (kind === "invoices") {
      await prisma.invoiceRow.createMany({
        data: rows.map((r: any) => ({
          orgId,
          batchId: batch.id,
          raw: r,
        })),
      });

      await incrementUsage(orgId, "invoice");
    }

    if (kind === "payments") {
      await prisma.paymentRow.createMany({
        data: rows.map((r: any) => ({
          orgId,
          batchId: batch.id,
          raw: r,
        })),
      });

      await incrementUsage(orgId, "payment");
    }

    if (kind === "price-list") {
      await prisma.priceListRow.createMany({
        data: rows.map((r: any) => ({
          orgId,
          batchId: batch.id,
          raw: r,
        })),
      });

      await incrementUsage(orgId, "price");
    }

    return new Response(
      JSON.stringify({ success: true, count: rows.length }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: e?.message || "Unknown error",
      }),
      { status: 500 }
    );
  }
}
