import { prisma } from "@/lib/prisma";

export async function trackError({
  type,
  userId,
  reportId,
  error,
  metadata,
}: {
  type: string;
  userId?: string;
  reportId?: string;
  error?: any;
  metadata?: any;
}) {
  try {
    await prisma.event.create({
      data: {
        type,
        userId,
        reportId,
        metadata: {
          ...(metadata || {}),
          errorMessage:
            error?.message ||
            String(error || "Unknown error"),
          errorName: error?.name || null,
          stack:
            process.env.NODE_ENV === "production"
              ? null
              : error?.stack || null,
        },
      },
    });
  } catch (trackingError) {
    console.error("ERROR TRACKING FAILED:", trackingError);
  }
}
