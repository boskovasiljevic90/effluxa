import { NextResponse } from "next/server";
import { runReconciliation } from "@/lib/reconcile";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orgId = body?.orgId;

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    const result = await runReconciliation(orgId);

    return NextResponse.json({
      success: true,
      runId: result.runId,
    });
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
