import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { rateLimit } from "@/lib/rateLimit";
import { trackEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Incoming = {
  email?: unknown;
  teaser?: {
    totalFindings?: unknown;
    duplicateExposure?: unknown;
    avoidableCost?: unknown;
    leakageScore?: unknown;
    currency?: unknown;
    fileName?: unknown;
  };
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function toText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : fallback;
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({ req, key: "instant_capture", limit: 5, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const body = (await req.json().catch(() => null)) as Incoming | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const teaser = {
      totalFindings: Math.round(toNumber(body?.teaser?.totalFindings)),
      duplicateExposure: Math.round(toNumber(body?.teaser?.duplicateExposure)),
      avoidableCost: Math.round(toNumber(body?.teaser?.avoidableCost)),
      leakageScore: Math.round(toNumber(body?.teaser?.leakageScore)),
      currency: toText(body?.teaser?.currency, "EUR").toUpperCase().slice(0, 3),
      fileName: toText(body?.teaser?.fileName),
    };

    const existing = await prisma.contactMessage.findFirst({
      where: { email, source: "instant_check_lead" },
      select: { id: true, pilotProfile: true },
    });

    const profile = {
      teaser,
      sentStages: [] as number[],
      capturedFrom: "instant",
    };

    if (existing) {
      await prisma.contactMessage.update({
        where: { id: existing.id },
        data: {
          status: "NEW",
          pilotProfile: profile as unknown as Prisma.InputJsonValue,
          nextActionAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });
    } else {
      await prisma.contactMessage.create({
        data: {
          email,
          subject: "Free file check result",
          message: "Requested the free check result by email.",
          source: "instant_check_lead",
          status: "NEW",
          pilotProfile: profile as unknown as Prisma.InputJsonValue,
          nextActionAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });
    }

    await trackEvent({
      type: "instant_check_email_captured",
      metadata: { returning: Boolean(existing), hasFindings: teaser.totalFindings > 0 },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("INSTANT CAPTURE ERROR:", error);
    return NextResponse.json({ error: "Could not save that email. Try again." }, { status: 500 });
  }
}
