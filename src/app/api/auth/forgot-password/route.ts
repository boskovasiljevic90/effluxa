export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { trackError } from "@/lib/errorTracking";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "forgot_password",
      limit: 5,
      windowMs: 60000,
    });

    if (limited) return limited;

    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Security: do not reveal whether user exists
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If this email exists, a reset link has been generated.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://effluxa.vercel.app";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: email,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    await trackError({ type: "forgot_password_error", error });

    return NextResponse.json(
      { error: "Failed to generate reset link." },
      { status: 500 }
    );
  }
}
