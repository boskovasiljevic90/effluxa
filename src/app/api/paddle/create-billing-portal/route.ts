export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { safeVerifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaddle } from "@/lib/paddle";
import { rateLimit } from "@/lib/rateLimit";
import { trackError } from "@/lib/errorTracking";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "paddle_billing_portal",
      limit: 10,
      windowMs: 60000,
    });

    if (limited) return limited;

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = safeVerifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      !["PRO", "BUSINESS"].includes(user.role) ||
      !user.paddleCustomerId ||
      !user.paddleSubscriptionId
    ) {
      return NextResponse.json(
        { error: "Billing portal is available only to active paid accounts." },
        { status: 403 }
      );
    }

    const portalSession = await getPaddle().customerPortalSessions.create(
      user.paddleCustomerId,
      [user.paddleSubscriptionId]
    );

    return NextResponse.json({ url: portalSession.urls.general.overview });
  } catch (error) {
    console.error("PADDLE BILLING PORTAL ERROR:", error);

    await trackError({
      type: "paddle_billing_portal_error",
      error,
    });

    return NextResponse.json(
      { error: "Failed to open billing portal." },
      { status: 500 }
    );
  }
}
