export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { safeVerifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";
import { rateLimit } from "@/lib/rateLimit";
import {
  createPaddleCheckoutTransaction,
  getPaddlePriceId,
} from "@/lib/paddle";
import { sendAdminNotificationEmail } from "@/lib/email";

let checkoutAlertSentAt = 0;

/**
 * A broken checkout is a silent revenue outage. Notify once per hour when the
 * billing provider rejects the request because of permissions or credentials.
 */
async function alertCheckoutOutage(error: any) {
  const code = String(error?.code || error?.type || "");
  if (!["forbidden", "authentication", "unauthorized"].includes(code)) return;
  if (Date.now() - checkoutAlertSentAt < 60 * 60 * 1000) return;
  checkoutAlertSentAt = Date.now();

  await sendAdminNotificationEmail({
    subject: "Effluxa checkout is failing",
    body: `Paddle rejected a checkout request: ${error?.message || "unknown error"}. Check the Paddle API key permissions for transactions.`,
  }).catch(() => undefined);
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "paddle_report_checkout",
      limit: 10,
      windowMs: 60000,
    });

    if (limited) return limited;

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = safeVerifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const reportId = body?.reportId;

    if (typeof reportId !== "string" || !reportId.trim()) {
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
        amount: 14900,
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
    await alertCheckoutOutage(error);

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
