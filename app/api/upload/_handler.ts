import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";

const FREE_LIMIT = 3;

export async function handleUpload(req: Request, kind: string) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Reset monthly usage if 30 days passed
    const now = new Date();
    const diff = now.getTime() - new Date(org.usageResetAt).getTime();
    const days = diff / (1000 * 60 * 60 * 24);

    if (days >= 30) {
      await prisma.organization.update({
        where: { clerkOrgId: orgId },
        data: {
          monthlyInvoiceCount: 0,
          usageResetAt: now,
        },
      });
      org.monthlyInvoiceCount = 0;
    }

    // Enforce FREE limit
    if (org.subscription === "FREE" && kind === "invoices") {
      if (org.monthlyInvoiceCount >= FREE_LIMIT) {
        return NextResponse.json(
          {
            error: "Free plan limit reached",
            message: "You can upload up to 3 invoices per month. Upgrade to PRO.",
          },
          { status: 403 }
        );
      }

      await prisma.organization.update({
        where: { clerkOrgId: orgId },
        data: {
          monthlyInvoiceCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
