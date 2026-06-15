export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ clients: [] });
    }

    const clients = await prisma.client.findMany({
      where: { ownerId: workspace.owner.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("CLIENT LIST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load clients." },
      { status: 500 }
    );
  }
}
