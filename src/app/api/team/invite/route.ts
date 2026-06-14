export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendTeamInviteEmail } from "@/lib/email";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    return await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "BUSINESS") {
    return NextResponse.json(
      { error: "Team seats are available only on the Business plan." },
      { status: 403 }
    );
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (normalizedEmail === user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "You are already the account owner." },
      { status: 400 }
    );
  }

  const existingMembers = await prisma.teamMember.count({
    where: { ownerId: user.id },
  });

  if (existingMembers >= 4) {
    return NextResponse.json(
      { error: "Business plan includes 5 seats total: owner + 4 team members." },
      { status: 403 }
    );
  }

  await prisma.teamMember.upsert({
    where: {
      ownerId_email: {
        ownerId: user.id,
        email: normalizedEmail,
      },
    },
    update: {
      status: "INVITED",
      invitedAt: new Date(),
    },
    create: {
      ownerId: user.id,
      email: normalizedEmail,
      status: "INVITED",
    },
  });

  await sendTeamInviteEmail({
    to: normalizedEmail,
    ownerEmail: user.email,
  });

  return NextResponse.json({ success: true });
}
