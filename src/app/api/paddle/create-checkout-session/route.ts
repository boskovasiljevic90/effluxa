export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";
import {
  createPaddleCheckoutTransaction,
  getPaddlePriceId,
} from "@/lib/paddle";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
    };

    const body = await req.json();
    const reportId = body?.reportId;

    if (!reportId) {
      return NextResponse.json(
        { error: "Missing reportId" },
        { status: 400 }
      );
    }

    const report = await prisma.upload.findFirst({
      where: {
        id: reportId,
        userId: decoded.userId,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { paddleCustomerId: true },
    });

    if (report.unlocked) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://www.effluxa.com";

      return NextResponse.json({
        url: `${appUrl}/dashboard/reports/${report.id}`,
      });
    }

    const priceId = getPaddlePriceId("full_audit");

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Full audit Paddle price is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const customData = {
      userId: decoded.userId,
      reportId: report.id,
      product: "full_audit_unlock",
      plan: "full_audit",
    } as const;

    const transaction = await createPaddleCheckoutTransaction({
      priceId,
      customerId: user?.paddleCustomerId,
      customData,
    });

    await trackEvent({
      type: "checkout_created",
      userId: decoded.userId,
      reportId: report.id,
      metadata: {
        transactionId: transaction.id,
        amount: 9900,
        currency: "eur",
        priceId,
        product: "full_audit_unlock",
      },
    });

    return NextResponse.json({
      url: transaction.checkout?.url,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("PADDLE TRANSACTION ERROR:", error);

    await trackError({
      type: "paddle_transaction_error",
      error,
    });

    return NextResponse.json(
      {
        error: "Paddle checkout failed",
      },
      {
        status: 500,
      }
    );
  }
}
