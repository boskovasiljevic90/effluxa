export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function DELETE(
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

    const report = await prisma.upload.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await prisma.upload.delete({
      where: {
        id: report.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE REPORT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
