export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendControlActionReminderEmail } from "@/lib/email";
import { trackEvent } from "@/lib/events";
import { hasActiveAgencyAccess } from "@/lib/complimentaryAccess";

const OPEN_STATUSES = ["OPEN", "IN_REVIEW"] as const;
const PAGE_SIZE = 1000;

function isAuthorized(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization");

  return Boolean(
    expectedSecret && authorization === `Bearer ${expectedSecret}`
  );
}

function isOverdue(action: { dueDate: Date | null }, now: Date) {
  return Boolean(action.dueDate && action.dueDate < now);
}

function needsReminder(
  action: { dueDate: Date | null; lastReminderAt: Date | null },
  now: Date,
  dailyCutoff: Date,
  weeklyCutoff: Date
) {
  if (!action.lastReminderAt) return true;

  return isOverdue(action, now)
    ? action.lastReminderAt < dailyCutoff
    : action.lastReminderAt < weeklyCutoff;
}

function isDueWithinSevenDays(
  action: { dueDate: Date | null },
  now: Date,
  sevenDaysFromNow: Date
) {
  return Boolean(
    action.dueDate &&
      action.dueDate >= now &&
      action.dueDate <= sevenDaysFromNow
  );
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Control reminder job is not configured." },
      { status: 503 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const dailyCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weeklyCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allActions: Array<{
      id: string;
      workspaceOwnerId: string;
      findingTitle: string;
      findingSeverity: string;
      status: string;
      ownerEmail: string | null;
      dueDate: Date | null;
      quantifiedAmount: number | null;
      currency: string;
      lastReminderAt: Date | null;
      report: {
        client: { name: string } | null;
      };
    }> = [];

    let cursor: string | undefined;

    while (true) {
      const page = await prisma.controlAction.findMany({
        where: {
          status: { in: [...OPEN_STATUSES] },
        },
        orderBy: { id: "asc" },
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          workspaceOwnerId: true,
          findingTitle: true,
          findingSeverity: true,
          status: true,
          ownerEmail: true,
          dueDate: true,
          quantifiedAmount: true,
          currency: true,
          lastReminderAt: true,
          report: {
            select: {
              client: { select: { name: true } },
            },
          },
        },
      });

      allActions.push(...page);

      if (page.length < PAGE_SIZE) break;
      cursor = page[page.length - 1]?.id;
      if (!cursor) break;
    }

    const reminderActions = allActions.filter((action) =>
      needsReminder(action, now, dailyCutoff, weeklyCutoff)
    );

    if (reminderActions.length === 0) {
      return NextResponse.json({
        success: true,
        checked: allActions.length,
        eligible: 0,
        sent: 0,
        failed: 0,
      });
    }

    const ownerIds = Array.from(
      new Set(reminderActions.map((action) => action.workspaceOwnerId))
    );

    const owners = await prisma.user.findMany({
      where: {
        id: { in: ownerIds },
        role: "BUSINESS",
        emailAuditReminders: true,
      },
      select: {
        id: true,
        email: true,
        companyName: true,
        paddleCustomerId: true,
        paddleSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        complimentaryAgencyAccessUntil: true,
        complimentaryAgencyAccessRevokedAt: true,
      },
    });

    const activeOwners = owners.filter((owner) =>
      hasActiveAgencyAccess(owner, now)
    );

    let sent = 0;
    let failed = 0;

    for (const owner of activeOwners) {
      const ownerActions = allActions.filter(
        (action) => action.workspaceOwnerId === owner.id
      );
      const ownerReminderActions = reminderActions.filter(
        (action) => action.workspaceOwnerId === owner.id
      );

      if (ownerReminderActions.length === 0) continue;

      const overdueCount = ownerActions.filter((action) =>
        isOverdue(action, now)
      ).length;
      const dueSoonCount = ownerActions.filter((action) =>
        isDueWithinSevenDays(action, now, sevenDaysFromNow)
      ).length;
      const openCount = ownerActions.filter((action) => action.status === "OPEN").length;
      const inReviewCount = ownerActions.filter(
        (action) => action.status === "IN_REVIEW"
      ).length;

      try {
        const delivered = await sendControlActionReminderEmail({
          to: owner.email,
          companyName: owner.companyName,
          openCount,
          inReviewCount,
          overdueCount,
          dueSoonCount,
        });

        if (!delivered) {
          failed += 1;
          continue;
        }

        await prisma.controlAction.updateMany({
          where: {
            id: { in: ownerReminderActions.map((action) => action.id) },
          },
          data: {
            lastReminderAt: now,
            lastReminderKind: overdueCount > 0 ? "OVERDUE" : "WEEKLY",
          },
        });

        await trackEvent({
          type: "control_action_reminder_sent",
          userId: owner.id,
          metadata: {
            actionCount: ownerReminderActions.length,
            overdueCount,
            dueSoonCount,
            openCount,
            inReviewCount,
          },
        });

        sent += 1;
      } catch (error) {
        failed += 1;
        console.error("CONTROL ACTION REMINDER DELIVERY ERROR:", error);
      }
    }

    return NextResponse.json({
      success: true,
      checked: allActions.length,
      eligible: reminderActions.length,
      workspaces: activeOwners.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("CONTROL ACTION REMINDER CRON ERROR:", error);

    return NextResponse.json(
      { error: "Failed to send control action reminders." },
      { status: 500 }
    );
  }
}
