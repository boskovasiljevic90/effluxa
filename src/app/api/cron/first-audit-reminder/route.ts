export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFirstAuditReminderEmail } from "@/lib/email";
import { trackEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          lte: oneDayAgo,
          gte: sevenDaysAgo,
        },
      },
      take: 100,
    });

    let sent = 0;

    for (const user of users) {
      const uploadsCount = await prisma.upload.count({
        where: {
          userId: user.id,
        },
      });

      if (uploadsCount > 0) continue;

      const alreadySent = await prisma.event.findFirst({
        where: {
          userId: user.id,
          type: "first_audit_reminder_sent",
        },
      });

      if (alreadySent) continue;

      await sendFirstAuditReminderEmail({
        to: user.email,
      });

      await trackEvent({
        type: "first_audit_reminder_sent",
        userId: user.id,
        metadata: {
          email: user.email,
        },
      });

      sent += 1;
    }

    return NextResponse.json({
      success: true,
      checked: users.length,
      sent,
    });
  } catch (error) {
    console.error("FIRST AUDIT REMINDER CRON ERROR:", error);

    return NextResponse.json(
      { error: "Failed to send first audit reminders." },
      { status: 500 }
    );
  }
}
