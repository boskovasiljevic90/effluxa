export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const body = await req.json();

    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        emailMonthlySummary: Boolean(body.emailMonthlySummary),
        emailProductUpdates: Boolean(body.emailProductUpdates),
        emailAuditReminders: Boolean(body.emailAuditReminders),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EMAIL PREFERENCES ERROR:", error);
    return NextResponse.json({ error: "Failed to update email preferences." }, { status: 500 });
  }
}
