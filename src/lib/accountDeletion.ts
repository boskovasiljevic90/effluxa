import { prisma } from "@/lib/prisma";

/**
 * Removes Effluxa-owned account data in dependency order.
 *
 * Paddle billing records remain with Paddle as the merchant of record. The
 * caller must ensure an active subscription has been cancelled before calling
 * this function so deletion cannot leave a customer unexpectedly billable.
 */
export async function deleteAccountData(userId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return { userDeleted: false, uploadsDeleted: 0, clientsDeleted: 0 };
    }

    const ownedClients = await tx.client.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const ownedClientIds = ownedClients.map((client) => client.id);

    const uploadsDeleted = await tx.upload.deleteMany({
      where: {
        OR: [
          { userId },
          ...(ownedClientIds.length > 0
            ? [{ clientId: { in: ownedClientIds } }]
            : []),
        ],
      },
    });

    const clientsDeleted = await tx.client.deleteMany({
      where: { ownerId: userId },
    });

    await tx.teamMember.deleteMany({
      where: {
        OR: [{ ownerId: userId }, { email: user.email }],
      },
    });

    await tx.event.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { email: user.email } });
    await tx.contactMessage.deleteMany({ where: { email: user.email } });
    await tx.user.delete({ where: { id: userId } });

    return {
      userDeleted: true,
      uploadsDeleted: uploadsDeleted.count,
      clientsDeleted: clientsDeleted.count,
    };
  });
}
