export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactNotificationEmail } from "@/lib/email";
import { trackError } from "@/lib/errorTracking";
import { trackEvent } from "@/lib/events";
import { rateLimit } from "@/lib/rateLimit";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pilotRoles = new Set([
  "accounting_bookkeeping",
  "fractional_cfo",
  "in_house_finance",
  "other",
]);
const pilotPortfolioSizes = new Set(["1_5", "6_20", "21_50", "50_plus"]);
const pilotFocuses = new Set([
  "duplicate_payments",
  "recurring_spend",
  "cash_flow",
  "not_sure",
]);

function allowedPilotChoice(value: unknown, allowed: Set<string>) {
  return typeof value === "string" && allowed.has(value) ? value : null;
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "contact",
      limit: 5,
      windowMs: 60000,
    });

    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const source = body?.source === "partner_pilot"
      ? "partner_pilot"
      : "general_support";
    const rawPilotProfile = body?.pilotProfile && typeof body.pilotProfile === "object" && !Array.isArray(body.pilotProfile)
      ? body.pilotProfile
      : null;
    const pilotRole = source === "partner_pilot"
      ? allowedPilotChoice(rawPilotProfile?.role, pilotRoles)
      : null;
    const pilotPortfolioSize = source === "partner_pilot"
      ? allowedPilotChoice(rawPilotProfile?.portfolioSize, pilotPortfolioSizes)
      : null;
    const pilotFocus = source === "partner_pilot"
      ? allowedPilotChoice(rawPilotProfile?.focus, pilotFocuses)
      : null;

    if (source === "partner_pilot" && (!pilotRole || !pilotPortfolioSize || !pilotFocus)) {
      return NextResponse.json(
        { error: "Please select your firm type, client portfolio size, and first audit focus." },
        { status: 400 }
      );
    }

    const pilotProfile = source === "partner_pilot"
      ? {
          role: pilotRole,
          portfolioSize: pilotPortfolioSize,
          focus: pilotFocus,
          canProvideRedactedFile: rawPilotProfile?.canProvideRedactedFile === true,
        }
      : null;

    if (!email || !message || !emailPattern.test(email)) {
      return NextResponse.json(
        { error: "A valid email and message are required." },
        { status: 400 }
      );
    }

    if (name.length > 120 || email.length > 254 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: "Please keep the message within the allowed length." },
        { status: 400 }
      );
    }

    const recentMessages = await prisma.contactMessage.count({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentMessages >= 3) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name: name || null,
        email,
        subject: subject || null,
        message,
        source,
        pilotProfile: pilotProfile || undefined,
      },
    });

    await trackEvent({
      type: "contact_message_submitted",
      metadata: {
        source,
        subjectProvided: Boolean(subject),
        pilotProfileProvided: Boolean(pilotProfile),
        pilotRole,
        pilotPortfolioSize,
        pilotFocus,
      },
    });

    await sendContactNotificationEmail({
      name,
      email,
      subject,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);
    await trackError({ type: "contact_error", error });

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
