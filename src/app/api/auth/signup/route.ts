export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { trackEvent } from "@/lib/events";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "auth_signup",
      limit: 5,
      windowMs: 60000,
    });

    if (limited) return limited;

    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = body?.password;
    const termsAccepted = body?.termsAccepted === true;

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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "FREE",
        weeklyUploadCount: 0,
      },
    });

    await trackEvent({
      type: "signup",
      userId: user.id,
      metadata: { email: user.email, termsAccepted: true },
    });

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
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
