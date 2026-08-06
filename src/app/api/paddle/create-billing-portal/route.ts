export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getPaddle } from "@/lib/paddle";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

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

    return NextResponse.json(
      { error: "Failed to open billing portal." },
      { status: 500 }
    );
  }
}
