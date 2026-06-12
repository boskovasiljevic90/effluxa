export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

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

    return NextResponse.json({
      success: true,
      message: "Password reset link generated.",
      resetUrl,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      { error: "Failed to generate reset link." },
      { status: 500 }
    );
  }
}
