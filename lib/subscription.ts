import { prisma } from "./prisma";

export async function hasActiveSubscription(orgId: string) {
  const sub = await prisma.organizationSubscription.findUnique({
    where: { orgId },
  });

  if (!sub) return false;
  if (sub.status !== "active") return false;

  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) {
    return false;
  }

  return true;
}
