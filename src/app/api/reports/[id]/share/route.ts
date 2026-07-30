export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getWorkspaceOwner } from "@/lib/workspace";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await getWorkspaceOwner(user);

    const report = await prisma.upload.findFirst({
      where: {
        id: params.id,
        userId: workspace.owner.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.unlocked && user.role !== "PRO" && !workspace.hasBusinessAccess) {
      return NextResponse.json(
        { error: "Only unlocked, Pro, or Agency reports can be shared." },
        { status: 403 }
      );
    }

    const shareToken =
      report.shareToken || crypto.randomBytes(24).toString("hex");

    const updatedReport = await prisma.upload.update({
      where: { id: report.id },
      data: { shareToken },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.effluxa.com";

    return NextResponse.json({
      success: true,
      shareUrl: `${appUrl}/share/${updatedReport.shareToken}`,
    });
  } catch (error) {
    console.error("SHARE REPORT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create share link." },
      { status: 500 }
    );
  }
}
