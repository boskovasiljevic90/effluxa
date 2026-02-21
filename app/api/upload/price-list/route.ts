import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndIncrementUsage } from "@/lib/limits";

export async function POST(req: Request) {
  try {
    const orgId = "demo-org";

    await checkAndIncrementUsage(orgId, "price");

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const text = await file.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { item: "Default", price: 100 };
    }

    const batch = await prisma.uploadBatch.create({
      data: {
        orgId,
        kind: "price-list",
        filename: file.name,
      },
    });

    await prisma.priceListRow.create({
      data: {
        orgId,
        batchId: batch.id,
        raw: parsed,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Price list stored in DB",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}
