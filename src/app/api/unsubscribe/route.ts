export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/trialNurture";
import { trackEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const email = verifyUnsubscribeToken(token);

  if (!email) {
    return NextResponse.json({ error: "This unsubscribe link is invalid or expired." }, { status: 400 });
  }

  await prisma.contactMessage.updateMany({
    where: { email, source: "instant_check_lead" },
    data: { status: "UNSUBSCRIBED" },
  });

  await prisma.user.updateMany({
    where: { email },
    data: {
      emailProductUpdates: false,
      emailAuditReminders: false,
      emailMonthlySummary: false,
    },
  });

  await trackEvent({ type: "email_unsubscribed" });

  return NextResponse.json({ ok: true, email });
}
