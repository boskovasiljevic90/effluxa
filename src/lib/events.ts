import { prisma } from "@/lib/prisma";

export async function trackEvent({
  type,
  userId,
  reportId,
  metadata,
}: {
  type: string;
  userId?: string;
  reportId?: string;
  metadata?: any;
}) {
  try {
    await prisma.event.create({
      data: {
        type,
        userId,
        reportId,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error("EVENT TRACKING ERROR:", error);
  }
}
