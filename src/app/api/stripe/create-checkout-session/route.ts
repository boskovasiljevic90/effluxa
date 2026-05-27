export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const body = await req.json();
    const reportId = body?.reportId;

    if (!reportId) {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const report = await prisma.upload.findFirst({
      where: {
        id: reportId,
        userId: decoded.userId,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.unlocked) {
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports/${report.id}`,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://effluxa.vercel.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Effluxa Full AI Financial Leak Audit",
              description: "One-time unlock of your full AI financial audit report.",
            },
            unit_amount: 2900,
          },
          quantity: 1,
        },
      ],

      metadata: {
        userId: decoded.userId,
        reportId: report.id,
        product: "full_audit_unlock",
      },

      success_url: `${appUrl}/dashboard/reports/${report.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/reports/${report.id}`,
    });

    await trackEvent({
      type: "checkout_created",
      userId: decoded.userId,
      reportId: report.id,
      metadata: {
        sessionId: session.id,
        amount: 2900,
        currency: "eur",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE SESSION ERROR:", error);

    return NextResponse.json(
      { error: "Stripe session failed" },
      { status: 500 }
    );
  }
}
