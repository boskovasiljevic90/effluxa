export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit({
      req,
      key: "auth_login",
      limit: 10,
      windowMs: 60000,
    });

    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production", // localhost
      sameSite: "lax",
    });

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "We couldn't sign you in right now. Please try again." },
      { status: 500 }
    );
  }
}
