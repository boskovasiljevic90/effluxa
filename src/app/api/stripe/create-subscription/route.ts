export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const allowedPlans = {
  pro_monthly: {
    priceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID",
    product: "pro_subscription",
  },
  pro_annual: {
    priceEnv: "STRIPE_PRO_ANNUAL_PRICE_ID",
    product: "pro_subscription",
  },
  agency_monthly: {
    priceEnv: "STRIPE_AGENCY_MONTHLY_PRICE_ID",
    product: "agency_subscription",
  },
  agency_annual: {
    priceEnv: "STRIPE_AGENCY_ANNUAL_PRICE_ID",
    product: "agency_subscription",
  },
} as const;

type Plan = keyof typeof allowedPlans;

function isPlan(value: unknown): value is Plan {
  return (
    typeof value === "string" &&
    value in allowedPlans
  );
}

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

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan;

    if (!isPlan(plan)) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    if (user.role === "PRO" && plan.startsWith("pro")) {
      return NextResponse.json(
        {
          error:
            "You are already on Pro. Use Billing in Settings to manage your subscription.",
        },
        { status: 400 }
      );
    }

    if (user.role === "BUSINESS" && plan.startsWith("agency")) {
      return NextResponse.json(
        {
          error:
            "Agency access is already active. Use Billing in Settings to manage your subscription.",
        },
        { status: 400 }
      );
    }

    const selectedPlan = allowedPlans[plan];
    const priceId = process.env[selectedPlan.priceEnv];

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured" },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.effluxa.com";

    const metadata = {
      userId: user.id,
      product: selectedPlan.product,
      plan,
    };

    const customerParams:
      | {
          customer: string;
        }
      | {
          customer_email: string;
        } = user.stripeCustomerId
      ? {
          customer: user.stripeCustomerId,
        }
      : {
          customer_email: user.email,
        };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      ...customerParams,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata,

      subscription_data: {
        metadata,
      },

      success_url:
        `${appUrl}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${appUrl}/dashboard?subscription=cancelled`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("SUBSCRIPTION CHECKOUT ERROR:", error);

    return NextResponse.json(
      {
        error: "Subscription checkout failed",
      },
      {
        status: 500,
      }
    );
  }
}
