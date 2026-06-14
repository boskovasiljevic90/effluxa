export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
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

    if (!user || user.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Business branding is available only for Business owners." },
        { status: 403 }
      );
    }

    const { companyName, reportFooter } = await req.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        companyName: companyName?.trim() || null,
        reportFooter: reportFooter?.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BRANDING UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update branding." },
      { status: 500 }
    );
  }
}
