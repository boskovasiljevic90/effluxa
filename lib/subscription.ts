import { prisma } from "./prisma";

export async function getSubscriptionStatus(orgId: string) {
  if (!orgId) return { plan: "free", active: false };

  const sub = await prisma.organizationSubscription?.findUnique({
    where: { orgId },
  });

  if (!sub) {
    return {
      plan: "free",
      active: false,
    };
  }

  const isActive =
    sub.status === "active" &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());

  return {
    plan: isActive ? "pro" : "free",
    active: isActive,
  };
}

export async function hasActiveSubscription(orgId: string) {
  const status = await getSubscriptionStatus(orgId);
  return status.active;
}
