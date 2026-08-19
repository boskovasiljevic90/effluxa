export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization");

  return Boolean(
    expectedSecret && authorization === `Bearer ${expectedSecret}`
  );
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Retention job is not configured." },
      { status: 503 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const resetTokenCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const eventCutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const contactMessageCutoff = new Date(
      now.getTime() - 730 * 24 * 60 * 60 * 1000
    );

    const [resetTokens, events, contactMessages] = await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { createdAt: { lt: resetTokenCutoff } },
          ],
        },
      }),
      prisma.event.deleteMany({
        where: { createdAt: { lt: eventCutoff } },
      }),
      prisma.contactMessage.deleteMany({
        where: { createdAt: { lt: contactMessageCutoff } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      deleted: {
        expiredPasswordResetTokens: resetTokens.count,
        oldEvents: events.count,
        oldContactMessages: contactMessages.count,
      },
    });
  } catch (error) {
    console.error("DATA RETENTION CRON ERROR:", error);

    return NextResponse.json(
      { error: "Data retention job failed." },
      { status: 500 }
    );
  }
}
