export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOperationalAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const admin = await getOperationalAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      weeklyUploadCount: 0,
      weeklyResetDate: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
