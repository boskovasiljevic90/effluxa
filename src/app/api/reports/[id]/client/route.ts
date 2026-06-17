export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
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

    if (!workspace.hasBusinessAccess) {
      return NextResponse.json(
        { error: "Client assignment is available only on Business." },
        { status: 403 }
      );
    }

    const { clientId } = await req.json();

    const report = await prisma.upload.findFirst({
      where: {
        id: params.id,
        userId: workspace.owner.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          ownerId: workspace.owner.id,
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found in this workspace." },
          { status: 400 }
        );
      }
    }

    await prisma.upload.update({
      where: { id: report.id },
      data: {
        clientId: clientId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REPORT CLIENT UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update report client." },
      { status: 500 }
    );
  }
}
