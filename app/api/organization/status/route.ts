import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const org = await prisma.organization.findUnique({
    where: { id: "demo-org" },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({
    orgId: org.id,
    plan: org.plan,
    subscriptionStatus: org.subscriptionStatus,
    weeklyInvoiceCount: org.weeklyInvoiceCount,
    weeklyPaymentCount: org.weeklyPaymentCount,
    weeklyPriceCount: org.weeklyPriceCount,
    weeklyReconcileCount: (org as any).weeklyReconcileCount ?? 0,
    usageResetAt: org.usageResetAt,
  });
}
