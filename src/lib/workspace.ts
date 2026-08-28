import { prisma } from "@/lib/prisma";
import { hasActiveAgencyAccess } from "@/lib/complimentaryAccess";

export async function getWorkspaceOwner(user: {
  id: string;
  email: string;
  role: string;
  paddleSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionEndDate?: Date | string | null;
  complimentaryAgencyAccessUntil?: Date | string | null;
  complimentaryAgencyAccessRevokedAt?: Date | string | null;
}) {
  const subscriptionActive = hasActiveAgencyAccess(user);

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

  const ownerSubscriptionActive = owner && hasActiveAgencyAccess(owner);

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
