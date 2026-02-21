import { prisma } from "@/lib/prisma";

export async function checkAndIncrementUsage(
  orgId: string,
  type: "invoice" | "payment" | "price" | "reconcile"
) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  // PRO plan = unlimited
  if (org.plan === "pro") {
    return;
  }

  const now = new Date();
  const resetAt = new Date(org.usageResetAt);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  let updatedOrg = org;

  // 🔁 WEEKLY RESET
  if (now.getTime() - resetAt.getTime() > oneWeek) {
    updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        weeklyInvoiceCount: 0,
        weeklyPaymentCount: 0,
        weeklyPriceCount: 0,
        weeklyReconcileCount: 0,
        usageResetAt: now,
      },
    });
  }

  // 🚫 LIMIT CHECKS
  if (type === "invoice" && updatedOrg.weeklyInvoiceCount >= 1) {
    throw new Error("Weekly invoice limit reached (Free plan)");
  }

  if (type === "payment" && updatedOrg.weeklyPaymentCount >= 1) {
    throw new Error("Weekly payment limit reached (Free plan)");
  }

  if (type === "price" && updatedOrg.weeklyPriceCount >= 1) {
    throw new Error("Weekly price list limit reached (Free plan)");
  }

  if (type === "reconcile" && updatedOrg.weeklyReconcileCount >= 1) {
    throw new Error("Weekly reconciliation limit reached (Free plan)");
  }

  // 📈 INCREMENT
  const incrementData: any = {};

  if (type === "invoice") {
    incrementData.weeklyInvoiceCount = { increment: 1 };
  }

  if (type === "payment") {
    incrementData.weeklyPaymentCount = { increment: 1 };
  }

  if (type === "price") {
    incrementData.weeklyPriceCount = { increment: 1 };
  }

  if (type === "reconcile") {
    incrementData.weeklyReconcileCount = { increment: 1 };
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: incrementData,
  });
}
