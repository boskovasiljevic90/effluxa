export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOperationalAdmin } from "@/lib/adminAuth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getOperationalAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.contactMessage.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getOperationalAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const allowedStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"];
  const status = typeof body?.status === "string" ? body.status.toUpperCase() : "";

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid contact lead status." }, { status: 400 });
  }

  const message = await prisma.contactMessage.update({
    where: { id: params.id },
    data: { status },
    select: { id: true, status: true },
  });

  return NextResponse.json({ success: true, message });
}
