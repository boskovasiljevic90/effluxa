export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getOperationalAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";

const ACCESS_DURATION_DAYS = 365;

function normalizedEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function findTargetUser(email: unknown) {
  const normalized = normalizedEmail(email);

  if (!normalized) {
    return { error: NextResponse.json({ error: "Email is required." }, { status: 400 }) };
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) {
    return { error: NextResponse.json({ error: "User not found." }, { status: 404 }) };
  }

  return { user };
}

export async function POST(req: NextRequest) {
  const admin = await getOperationalAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const target = await findTargetUser(body?.email);

    if (target.error) return target.error;

    const user = target.user;

    if (
      user.paddleSubscriptionId &&
      ["active", "trialing"].includes(user.subscriptionStatus)
    ) {
      return NextResponse.json(
        { error: "Do not replace an active paid Paddle subscription with partner access." },
        { status: 409 }
      );
    }

    const now = new Date();
    const until = new Date(now.getTime() + ACCESS_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: Role.BUSINESS,
        complimentaryAgencyAccessUntil: until,
        complimentaryAgencyAccessGrantedAt: now,
        complimentaryAgencyAccessRevokedAt: null,
        complimentaryAgencyAccessReason: "Partner / promotional access",
      },
      select: {
        id: true,
        email: true,
        role: true,
        complimentaryAgencyAccessUntil: true,
      },
    });

    await trackEvent({
      type: "complimentary_agency_access_granted",
      userId: user.id,
      metadata: {
        email: user.email,
        grantedBy: admin.email,
        accessUntil: until.toISOString(),
        durationDays: ACCESS_DURATION_DAYS,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("COMPLIMENTARY AGENCY GRANT ERROR:", error);
    return NextResponse.json({ error: "Failed to grant partner access." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getOperationalAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const target = await findTargetUser(body?.email);

    if (target.error) return target.error;

    const user = target.user;
    const now = new Date();
    const hasActivePaidSubscription = Boolean(
      user.paddleSubscriptionId &&
      ["active", "trialing"].includes(user.subscriptionStatus) &&
      (!user.subscriptionEndDate || user.subscriptionEndDate > now)
    );

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: hasActivePaidSubscription ? user.role : Role.FREE,
        complimentaryAgencyAccessRevokedAt: now,
      },
      select: {
        id: true,
        email: true,
        role: true,
        complimentaryAgencyAccessUntil: true,
        complimentaryAgencyAccessRevokedAt: true,
      },
    });

    await trackEvent({
      type: "complimentary_agency_access_revoked",
      userId: user.id,
      metadata: {
        email: user.email,
        revokedBy: admin.email,
        revokedAt: now.toISOString(),
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("COMPLIMENTARY AGENCY REVOKE ERROR:", error);
    return NextResponse.json({ error: "Failed to revoke partner access." }, { status: 500 });
  }
}
