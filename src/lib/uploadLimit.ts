import { prisma } from "./prisma";

export async function checkAndUpdateUploadLimit(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return { allowed: false };

  if (user.role === "PRO") {
    return { allowed: true };
  }

  const now = new Date();
  const resetDate = new Date(user.weeklyResetDate);
  const diff = now.getTime() - resetDate.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (diff > sevenDays) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        weeklyUploadCount: 0,
        weeklyResetDate: now,
      },
    });
    return { allowed: true };
  }

  if (user.role !== "BUSINESS" && user.weeklyUploadCount >= 4) {
    return { allowed: false };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      weeklyUploadCount: {
        increment: 1,
      },
    },
  });

  return { allowed: true };
}
