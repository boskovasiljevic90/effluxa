export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const workspace = await getWorkspaceOwner(user);

    if (!workspace.hasBusinessAccess) {
      return NextResponse.json({ error: "Agency access required." }, { status: 403 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        ownerId: workspace.owner.id,
      },
    });

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const shareToken = client.shareToken || crypto.randomBytes(24).toString("hex");

    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: { shareToken },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";

    return NextResponse.json({
      success: true,
      shareUrl: `${appUrl}/client-share/${updatedClient.shareToken}`,
    });
  } catch (error) {
    console.error("CLIENT SHARE ERROR:", error);
    return NextResponse.json({ error: "Failed to create client share link." }, { status: 500 });
  }
}
