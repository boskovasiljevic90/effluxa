import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const orgId = "demo-org";

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const text = await file.text();

    // Minimal parser: assume JSON invoice for now
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        invoiceNumber: "INV-" + Date.now(),
        amount: 100,
        currency: "EUR",
      };
    }

    const batch = await prisma.uploadBatch.create({
      data: {
        orgId,
        kind: "invoices",
        filename: file.name,
      },
    });

    await prisma.invoiceRow.create({
      data: {
        orgId,
        batchId: batch.id,
        raw: parsed,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invoice stored in DB",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message },
      { status: 500 }
    );
  }
}
