import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const orgId = "demo-org"; // privremeno dok Clerk ne vratimo

    let org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          id: orgId,
          plan: "free",
        },
      });
    }

    return NextResponse.json({
      plan: org.plan || "free",
      weeklyUsage: {
        invoices: org.weeklyInvoiceCount,
        payments: org.weeklyPaymentCount,
        priceList: org.weeklyPriceCount,
        resetAt: org.usageResetAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
