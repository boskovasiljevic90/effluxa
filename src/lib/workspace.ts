import { prisma } from "@/lib/prisma";

export async function getWorkspaceOwner(user: {
  id: string;
  email: string;
  role: string;
}) {
  const now = new Date();
  const subscriptionActive =
    user.role === "BUSINESS" &&
    (user as any).subscriptionStatus === "active" &&
    (!(user as any).subscriptionEndDate || new Date((user as any).subscriptionEndDate) > now);

  if (subscriptionActive) {
    return {
      owner: user,
      isOwner: true,
      isTeamMember: false,
      hasBusinessAccess: true,
    };
  }

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      email: user.email.toLowerCase(),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!teamMember) {
    return {
      owner: user,
      isOwner: true,
      isTeamMember: false,
      hasBusinessAccess: false,
    };
  }

  const owner = await prisma.user.findUnique({
    where: {
      id: teamMember.ownerId,
    },
  });

  const ownerSubscriptionActive =
    owner &&
    owner.role === "BUSINESS" &&
    (owner as any).subscriptionStatus === "active" &&
    (!(owner as any).subscriptionEndDate || new Date((owner as any).subscriptionEndDate) > now);

  if (!owner || !ownerSubscriptionActive) {
    return {
      owner: user,
      isOwner: true,
      isTeamMember: false,
      hasBusinessAccess: false,
    };
  }

  if (teamMember.status !== "ACTIVE") {
    await prisma.teamMember.update({
      where: {
        id: teamMember.id,
      },
      data: {
        status: "ACTIVE",
      },
    });
  }

  return {
    owner,
    isOwner: false,
    isTeamMember: true,
    hasBusinessAccess: true,
  };
}
