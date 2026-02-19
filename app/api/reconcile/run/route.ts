import { NextResponse } from "next/server";
import { runReconciliation } from "@/lib/reconcile";

export async function POST() {
  try {
    await runReconciliation();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Internal error",
        message: e?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
