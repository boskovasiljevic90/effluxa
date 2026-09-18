export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOperationalAdmin } from "@/lib/adminAuth";
import { trackEvent } from "@/lib/events";

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

  const hasNextActionAt = Boolean(body && Object.prototype.hasOwnProperty.call(body, "nextActionAt"));
  const nextActionAtValue = hasNextActionAt ? body.nextActionAt : undefined;
  let nextActionAt: Date | null | undefined;

  if (hasNextActionAt) {
    if (nextActionAtValue === null || nextActionAtValue === "") {
      nextActionAt = null;
    } else if (typeof nextActionAtValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextActionAtValue)) {
      const parsed = new Date(`${nextActionAtValue}T23:59:59.999Z`);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Next action date is invalid." }, { status: 400 });
      }
      nextActionAt = parsed;
    } else {
      return NextResponse.json({ error: "Next action date must use YYYY-MM-DD format." }, { status: 400 });
    }
  }

  const hasInternalNote = Boolean(body && Object.prototype.hasOwnProperty.call(body, "internalNote"));
  let internalNote: string | null | undefined;

  if (hasInternalNote) {
    if (body.internalNote === null || body.internalNote === undefined) {
      internalNote = null;
    } else if (typeof body.internalNote === "string") {
      const trimmed = body.internalNote.trim();
      if (trimmed.length > 2000) {
        return NextResponse.json({ error: "Internal note is too long." }, { status: 400 });
      }
      internalNote = trimmed || null;
    } else {
      return NextResponse.json({ error: "Internal note must be text." }, { status: 400 });
    }
  }

  const updateData: {
    status: string;
    nextActionAt?: Date | null;
    internalNote?: string | null;
  } = { status };

  if (hasNextActionAt) updateData.nextActionAt = nextActionAt;
  if (hasInternalNote) updateData.internalNote = internalNote;

  const message = await prisma.contactMessage.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      status: true,
      source: true,
      nextActionAt: true,
      internalNote: true,
    },
  });

  await trackEvent({
    type: "contact_lead_status_changed",
    userId: admin.id,
    metadata: {
      contactMessageId: message.id,
      source: message.source,
      status: message.status,
      nextActionScheduled: Boolean(message.nextActionAt),
      internalNoteUpdated: hasInternalNote,
    },
  });

  return NextResponse.json({ success: true, message });
}
