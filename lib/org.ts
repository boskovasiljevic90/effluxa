import { prisma } from "./prisma";

export async function ensureOrg(orgId: string) {
  if (!orgId) throw new Error("Missing orgId");

  let org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: orgId,
        plan: "free",
        weeklyInvoiceCount: 0,
        weeklyPaymentCount: 0,
        weeklyPriceCount: 0,
        usageResetAt: new Date(),
      },
    });
  }

  return org;
}

export async function incrementUsage(
  orgId: string,
  type: "invoice" | "payment" | "price"
) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) return;

  const now = new Date();
  const resetAt = org.usageResetAt || now;

  // reset weekly counters if 7 days passed
  const diffDays =
    (now.getTime() - new Date(resetAt).getTime()) / (1000 * 60 * 60 * 24);

  let data: any = {};

  if (diffDays >= 7) {
    data.weeklyInvoiceCount = 0;
    data.weeklyPaymentCount = 0;
    data.weeklyPriceCount = 0;
    data.usageResetAt = now;
  }

  if (type === "invoice") {
    data.weeklyInvoiceCount = (org.weeklyInvoiceCount || 0) + 1;
  }

  if (type === "payment") {
    data.weeklyPaymentCount = (org.weeklyPaymentCount || 0) + 1;
  }

  if (type === "price") {
    data.weeklyPriceCount = (org.weeklyPriceCount || 0) + 1;
  }

  await prisma.organization.update({
    where: { id: orgId },
    data,
  });
}
