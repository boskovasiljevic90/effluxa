import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runReconciliation } from "../../../../lib/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "Missing organization" }, { status: 400 });
    }

    // 🔥 FIX — runReconciliation expects string, not object
    const result = await runReconciliation(orgId);

    return NextResponse.json({
      ok: true,
      runId: result?.runId ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
