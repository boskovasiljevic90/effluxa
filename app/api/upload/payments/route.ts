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

    const parsed = {
      invoiceNumber: "INV-123",
      amount: 100,
    };

    const batch = await prisma.uploadBatch.create({
      data: {
        orgId,
        kind: "payments",
        filename: file.name,
      },
    });

    await prisma.paymentRow.create({
      data: {
        orgId,
        batchId: batch.id,
        raw: parsed,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment stored in DB",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message },
      { status: 500 }
    );
  }
}
