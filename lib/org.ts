import { prisma } from "./prisma";

export async function ensureOrg(orgId: string) {
  const existing = await prisma.organization.findUnique({ where: { id: orgId } });
  if (existing) return existing;

  return prisma.organization.create({
    data: {
      id: orgId,
      name: orgId === "demo" ? "Effluxa Demo" : orgId,
      plan: "free",
    },
  });
}
