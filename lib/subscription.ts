import { prisma } from "@/lib/prisma";

export async function resetWeeklyUsageIfNeeded(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) return;

  const now = new Date();
  const resetAt = org.usageResetAt;

  if (!resetAt || now > resetAt) {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        usageResetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        weeklyInvoiceCount: 0,
        weeklyPaymentCount: 0,
        weeklyPriceCount: 0,
      },
    });
  }
}

export async function getSubscriptionStatus(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    return {
      plan: "free",
      weeklyUsage: {
        invoices: 0,
        payments: 0,
        priceList: 0,
        resetAt: null,
      },
    };
  }

  return {
    plan: org.plan || "free",
    weeklyUsage: {
      invoices: org.weeklyInvoiceCount,
      payments: org.weeklyPaymentCount,
      priceList: org.weeklyPriceCount,
      resetAt: org.usageResetAt,
    },
  };
}
