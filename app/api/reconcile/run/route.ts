import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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

    // ✅ IMPORTANT: lazy imports to avoid Turbopack/ESM callstack loops
    const [{ prisma }, { runReconciliation }] = await Promise.all([
      import("../../../../lib/prisma"),
      import("../../../../lib/reconcile"),
    ]);

    const result = await runReconciliation({ orgId, prisma });

    // ✅ Return only plain JSON-safe fields
    return NextResponse.json(
      {
        ok: true,
        runId: result.runId,
        summary: result.summary,
        invoicesCount: result.invoicesCount,
        paymentsCount: result.paymentsCount,
      },
      { status: 200 }
    );
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    return NextResponse.json({ error: "Internal error", message: msg }, { status: 500 });
  }
}
