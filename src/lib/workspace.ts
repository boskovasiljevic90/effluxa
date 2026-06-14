import { prisma } from "@/lib/prisma";

export async function getWorkspaceOwner(user: {
  id: string;
  email: string;
  role: string;
}) {
  if (user.role === "BUSINESS") {
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

  if (!owner || owner.role !== "BUSINESS") {
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
