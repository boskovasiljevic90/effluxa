export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getWorkspaceOwner } from "@/lib/workspace";
import { sendTeamInviteEmail } from "@/lib/email";
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
        { error: "Only active Business workspace owners can resend invites." },
        { status: 403 }
      );
    }

    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "Missing memberId." }, { status: 400 });
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        ownerId: workspace.owner.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }

    await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        status: "INVITED",
        invitedAt: new Date(),
      },
    });

    await sendTeamInviteEmail({
      to: member.email,
      ownerEmail: workspace.owner.email,
    });

    await trackEvent({
      type: "team_invite_resent",
      userId: workspace.owner.id,
      metadata: {
        email: member.email,
        workspaceOwnerId: workspace.owner.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RESEND TEAM INVITE ERROR:", error);
    return NextResponse.json({ error: "Failed to resend invite." }, { status: 500 });
  }
}
