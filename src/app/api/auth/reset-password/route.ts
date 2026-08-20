export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { trackError } from "@/lib/errorTracking";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "reset_password",
      limit: 10,
      windowMs: 60000,
    });

    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const resetCompleted = await prisma.$transaction(async (tx) => {
      const consumedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: { used: true },
      });

      if (consumedToken.count !== 1) {
        return false;
      }

      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return true;
    });

    if (!resetCompleted) {
      return NextResponse.json(
        { error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    await trackError({ type: "reset_password_error", error });

    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
