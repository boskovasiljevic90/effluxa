import { prisma } from "@/lib/prisma";

export async function hasActiveSubscription(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) return false;

  // FREE nema aktivnu pretplatu
  if (org.subscription === "FREE") return false;

  return true;
}

export async function getSubscriptionPlan(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  return org?.subscription || "FREE";
}

export async function setSubscriptionPlan(
  orgId: string,
  plan: "FREE" | "PRO" | "ENTERPRISE"
) {
  await prisma.organization.update({
    where: { id: orgId },
    data: { subscription: plan },
  });
}
