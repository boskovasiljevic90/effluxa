import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/limits";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orgId = formData.get("orgId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // 🔒 PLAN LIMIT CHECK
    await checkAndIncrementUsage(orgId, "invoice");

    const text = await file.text();

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
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
