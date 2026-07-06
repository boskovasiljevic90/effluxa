export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";

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

    if (!workspace.hasBusinessAccess) {
      return NextResponse.json(
        { error: "Client management is available only on Business." },
        { status: 403 }
      );
    }

    const { clientId, name, notes } = await req.json();

    const clientName = String(name || "").trim();

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId." }, { status: 400 });
    }

    if (!clientName) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        ownerId: workspace.owner.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    const duplicateClient = await prisma.client.findFirst({
      where: {
        ownerId: workspace.owner.id,
        name: clientName,
        NOT: {
          id: clientId,
        },
      },
    });

    if (duplicateClient) {
      return NextResponse.json(
        { error: "Another client with this name already exists." },
        { status: 400 }
      );
    }

    await prisma.client.update({
      where: { id: existingClient.id },
      data: {
        name: clientName,
        notes: String(notes || "").trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE CLIENT ERROR:", error);
    return NextResponse.json({ error: "Failed to update client." }, { status: 500 });
  }
}
