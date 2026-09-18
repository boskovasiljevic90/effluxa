export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { trackEvent } from "@/lib/events";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";
import { normalizeReferralCode, REFERRAL_COOKIE } from "@/lib/referrals";
import { ACQUISITION_COOKIE, parseAcquisitionCookie } from "@/lib/acquisition";

const subscriptionPlanIntents = new Set([
  "pro_monthly",
  "pro_annual",
  "agency_monthly",
  "agency_annual",
]);

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "auth_signup",
      limit: 5,
      windowMs: 60000,
    });

    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const termsAccepted = body?.termsAccepted === true;
    const planIntent = typeof body?.planIntent === "string" && subscriptionPlanIntents.has(body.planIntent)
      ? body.planIntent
      : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the Terms of Service and Privacy Policy." },
        { status: 400 }
      );
    }

    if (email.length > 254 || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const referralCode = normalizeReferralCode(
      req.cookies.get(REFERRAL_COOKIE)?.value
    );
    const acquisition = parseAcquisitionCookie(
      req.cookies.get(ACQUISITION_COOKIE)?.value
    );
    const now = new Date();
    const referringPartner = referralCode
      ? await prisma.user.findFirst({
          where: {
            referralCode,
            role: "BUSINESS",
            OR: [
              {
                complimentaryAgencyAccessUntil: { gt: now },
                complimentaryAgencyAccessRevokedAt: null,
              },
              {
                paddleSubscriptionId: { not: null },
                subscriptionStatus: { in: ["active", "trialing"] },
                OR: [
                  { subscriptionEndDate: null },
                  { subscriptionEndDate: { gt: now } },
                ],
              },
            ],
          },
          select: { id: true, referralCode: true },
        })
      : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "FREE",
        weeklyUploadCount: 0,
        referredByCode: referringPartner?.referralCode || null,
      },
    });

    await trackEvent({
      type: "signup",
      userId: user.id,
      metadata: {
        termsAccepted: true,
        acquisitionChannel: referringPartner
          ? "partner_referral"
          : acquisition
            ? "organic"
            : "direct",
        acquisitionSource: acquisition?.source || null,
        acquisitionMedium: acquisition?.medium || null,
        acquisitionCampaign: acquisition?.campaign || null,
        acquisitionContent: acquisition?.content || null,
        acquisitionLandingPath: acquisition?.landingPath || null,
        referralCode: referringPartner?.referralCode || null,
        planIntent,
      },
    });

    if (referringPartner?.referralCode) {
      await trackEvent({
        type: "referral_signup",
        userId: user.id,
        metadata: {
          referralCode: referringPartner.referralCode,
          partnerUserId: referringPartner.id,
        },
      });
    }

    try {
      await sendWelcomeEmail({ to: email });
    } catch (error) {
      console.error("WELCOME EMAIL ERROR:", error);
    }


    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return NextResponse.json(
      { error: "We couldn't create your account right now. Please try again." },
      { status: 500 }
    );
  }
}
