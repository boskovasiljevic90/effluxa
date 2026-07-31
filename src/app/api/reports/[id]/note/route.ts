export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const workspace = await getWorkspaceOwner(user);

    if (!workspace.hasBusinessAccess) {
      return NextResponse.json({ error: "Agency access required." }, { status: 403 });
    }

    const { internalNote } = await req.json();

    const report = await prisma.upload.findFirst({
      where: {
        id: params.id,
        userId: workspace.owner.id,
      },
    });

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    await prisma.upload.update({
      where: { id: report.id },
      data: {
        internalNote: String(internalNote || "").trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REPORT NOTE ERROR:", error);
    return NextResponse.json({ error: "Failed to save note." }, { status: 500 });
  }
}
