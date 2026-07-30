export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    if (report.unlocked) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://www.effluxa.com";

      return NextResponse.json({
        url: `${appUrl}/dashboard/reports/${report.id}`,
      });
    }

    const priceId =
      process.env.STRIPE_FULL_AUDIT_PRICE_ID ||
      process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Full audit Stripe price is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.effluxa.com";

    const metadata = {
      userId: decoded.userId,
      reportId: report.id,
      product: "full_audit_unlock",
      plan: "full_audit",
    };

    const session =
      await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        metadata,

        payment_intent_data: {
          metadata,
        },

        success_url:
          `${appUrl}/dashboard/reports/${report.id}?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${appUrl}/dashboard/reports/${report.id}`,
      });

    await trackEvent({
      type: "checkout_created",
      userId: decoded.userId,
      reportId: report.id,
      metadata: {
        sessionId: session.id,
        amount: 9900,
        currency: "eur",
        priceId,
        product: "full_audit_unlock",
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("STRIPE SESSION ERROR:", error);

    await trackError({
      type: "stripe_session_error",
      error,
    });

    return NextResponse.json(
      {
        error: "Stripe session failed",
      },
      {
        status: 500,
      }
    );
  }
}
