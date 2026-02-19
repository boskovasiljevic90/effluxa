import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.reconcileResult.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message },
      { status: 500 }
    );
  }
}
