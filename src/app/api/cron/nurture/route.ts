export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { trackEvent } from "@/lib/events";
import {
  NURTURE_SCHEDULE_HOURS,
  NURTURE_STAGES,
  buildNurtureEmail,
  sendNurtureEmail,
  unsubscribeUrlFor,
  type NurtureStage,
  type TeaserSnapshot,
} from "@/lib/trialNurture";

const MAX_SENDS_PER_RUN = 40;
const WINDOW_DAYS = 30;

type StoredProfile = {
  teaser?: Partial<TeaserSnapshot>;
  sentStages?: number[];
};

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET?.trim();

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const leads = await prisma.contactMessage.findMany({
      where: {
        source: "instant_check_lead",
        status: { in: ["NEW", "CONTACTED"] },
        createdAt: { gte: new Date(now - WINDOW_DAYS * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        email: true,
        pilotProfile: true,
        createdAt: true,
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const lead of leads) {
      if (sent >= MAX_SENDS_PER_RUN) break;

      const profile = (lead.pilotProfile && typeof lead.pilotProfile === "object"
        ? lead.pilotProfile
        : {}) as StoredProfile;
      const alreadySent = new Set(
        Array.isArray(profile.sentStages) ? profile.sentStages.map(Number) : []
      );

      const elapsedHours = (now - lead.createdAt.getTime()) / (60 * 60 * 1000);

      const dueStage = NURTURE_STAGES.find((stage) => {
        if (alreadySent.has(stage)) return false;
        return elapsedHours >= NURTURE_SCHEDULE_HOURS[stage as NurtureStage];
      });

      if (dueStage === undefined) {
        skipped += 1;
        continue;
      }

      const teaser: TeaserSnapshot = {
        totalFindings: Number(profile.teaser?.totalFindings) || 0,
        duplicateExposure: Number(profile.teaser?.duplicateExposure) || 0,
        avoidableCost: Number(profile.teaser?.avoidableCost) || 0,
        leakageScore: Number(profile.teaser?.leakageScore) || 0,
        currency: typeof profile.teaser?.currency === "string" ? profile.teaser.currency : "EUR",
        fileName: typeof profile.teaser?.fileName === "string" ? profile.teaser.fileName : undefined,
      };

      const message = buildNurtureEmail({
        stage: dueStage as NurtureStage,
        teaser,
        unsubscribeUrl: unsubscribeUrlFor(lead.email),
      });

      const delivered = await sendNurtureEmail({ to: lead.email, email: message });

      if (!delivered) {
        skipped += 1;
        continue;
      }

      const nextStages = Array.from(alreadySent).concat(dueStage).sort((a, b) => a - b);

      await prisma.contactMessage.update({
        where: { id: lead.id },
        data: {
          status: "CONTACTED",
          pilotProfile: {
            ...profile,
            sentStages: nextStages,
          } as unknown as Prisma.InputJsonValue,
          nextActionAt: new Date(now + 24 * 60 * 60 * 1000),
        },
      });

      await trackEvent({
        type: "instant_nurture_sent",
        metadata: { stage: dueStage },
      });

      sent += 1;
    }

    return NextResponse.json({ ok: true, examined: leads.length, sent, skipped });
  } catch (error) {
    console.error("NURTURE CRON ERROR:", error);
    return NextResponse.json({ error: "Nurture run failed." }, { status: 500 });
  }
}
