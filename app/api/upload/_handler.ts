import { prisma } from "@/lib/prisma";
import { parsePdfInvoice } from "@/lib/parse-pdf-invoice";
import { parseTabular } from "@/lib/parse-tabular";

export async function handleUpload(
  req: Request,
  kind: "invoices" | "payments" | "price-list"
) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return {
        error: "No file provided"
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;

    let rows: any[] = [];

    if (kind === "invoices" && filename.endsWith(".pdf")) {
      const extracted = await parsePdfInvoice(buffer, filename);
      rows = extracted ? [extracted] : [];
    } else {
      rows = await parseTabular(buffer, filename);
    }

    if (!rows || rows.length === 0) {
      return {
        error: "No rows parsed from file"
      };
    }

    for (const row of rows) {
      if (kind === "invoices") {
        await prisma.invoiceRow.create({
          data: {
            orgId: "demo-org",
            raw: row
          }
        });
      }

      if (kind === "payments") {
        await prisma.paymentRow.create({
          data: {
            orgId: "demo-org",
            raw: row
          }
        });
      }

      if (kind === "price-list") {
        await prisma.priceListRow.create({
          data: {
            orgId: "demo-org",
            raw: row
          }
        });
      }
    }

    return {
      success: true,
      inserted: rows.length
    };

  } catch (e: any) {
    return {
      error: "Upload failed",
      message: e?.message
    };
  }
}
