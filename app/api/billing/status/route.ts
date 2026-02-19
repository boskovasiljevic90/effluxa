import { NextResponse } from "next/server";
import { getOrgIdFromRequest } from "@/lib/auth";
import { ensureOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const orgId = getOrgIdFromRequest(req);

    // ensure org exists
    const org = await ensureOrg(orgId);

    return NextResponse.json({
      success: true,
      plan: org.plan || "free",
      weeklyUsage: {
        invoices: org.weeklyInvoiceUploads,
        payments: org.weeklyPaymentUploads,
        priceList: org.weeklyPriceListUploads,
        resetAt: org.usageResetAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
