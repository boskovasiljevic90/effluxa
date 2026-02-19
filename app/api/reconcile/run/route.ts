import { NextResponse } from "next/server";
import { getOrgIdFromRequest } from "@/lib/auth";
import { ensureOrg } from "@/lib/org";
import { runReconciliation } from "@/lib/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const orgId = getOrgIdFromRequest(req);
    await ensureOrg(orgId);

    const run = await runReconciliation(orgId);
    return NextResponse.json({ success: true, runId: run.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
