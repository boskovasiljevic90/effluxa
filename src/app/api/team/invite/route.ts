export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendTeamInviteEmail } from "@/lib/email";
import { getWorkspaceOwner } from "@/lib/workspace";
import { trackEvent } from "@/lib/events";

async function getUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return await prisma.user.findUnique({ where: { id: decoded.userId } });
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await getWorkspaceOwner(user);

    if (!workspace.hasBusinessAccess || !workspace.isOwner) {
      return NextResponse.json(
        { error: "Only active Business workspace owners can invite team members." },
        { status: 403 }
      );
    }

    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (normalizedEmail === workspace.owner.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You are already the account owner." },
        { status: 400 }
      );
    }

    const existingMembers = await prisma.teamMember.count({
      where: { ownerId: workspace.owner.id },
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
          ownerId: workspace.owner.id,
          email: normalizedEmail,
        },
      },
      update: {
        status: "INVITED",
        invitedAt: new Date(),
      },
      create: {
        ownerId: workspace.owner.id,
        email: normalizedEmail,
        status: "INVITED",
      },
    });

    await sendTeamInviteEmail({
      to: normalizedEmail,
      ownerEmail: workspace.owner.email,
    });

    await trackEvent({
      type: "team_invite_sent",
      userId: workspace.owner.id,
      metadata: {
        email: normalizedEmail,
        workspaceOwnerId: workspace.owner.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("TEAM INVITE ERROR:", error);
    return NextResponse.json({ error: "Failed to invite team member." }, { status: 500 });
  }
}
