export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!process.env.STRIPE_BUSINESS_PRICE_ID) {
      return NextResponse.json(
        { error: "Business price ID is not configured." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_BUSINESS_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        product: "business_subscription",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          product: "business_subscription",
        },
      },
      success_url: `${appUrl}/dashboard?business=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?business=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("BUSINESS SUBSCRIPTION ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create business subscription." },
      { status: 500 }
    );
  }
}
