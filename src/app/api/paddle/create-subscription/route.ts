export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import {
  createPaddleCheckoutTransaction,
  getPaddlePriceId,
  type PaddlePlan,
  type PaddleProduct,
} from "@/lib/paddle";

const allowedPlans = {
  pro_monthly: {
    product: "pro_subscription",
  },
  pro_annual: {
    product: "pro_subscription",
  },
  agency_monthly: {
    product: "agency_subscription",
  },
  agency_annual: {
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
    const priceId = getPaddlePriceId(plan as PaddlePlan);

    if (!priceId) {
      return NextResponse.json({ error: "Paddle price not configured" }, { status: 500 });
    }

    const customData = {
      userId: user.id,
      product: selectedPlan.product,
      plan,
    } as {
      userId: string;
      product: PaddleProduct;
      plan: PaddlePlan;
    };

    const transaction = await createPaddleCheckoutTransaction({
      priceId,
      customerId: user.paddleCustomerId,
      customData,
    });

    return NextResponse.json({
      url: transaction.checkout?.url,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("PADDLE SUBSCRIPTION CHECKOUT ERROR:", error);

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
