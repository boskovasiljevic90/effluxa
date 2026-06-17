export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";

function csvEscape(value: any) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(
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
      return NextResponse.json({ error: "Business access required." }, { status: 403 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        ownerId: workspace.owner.id,
      },
      include: {
        uploads: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const rows = [
      [
        "Client",
        "File",
        "Date",
        "Leakage Score",
        "Risk Level",
        "Estimated Savings",
        "Confidence",
        "Unlocked",
        "Internal Note",
      ],
      ...client.uploads.map((upload) => {
        const data = upload.parsedData as any;

        return [
          client.name,
          upload.fileUrl,
          upload.createdAt.toISOString(),
          data?.leakage_score ?? "",
          data?.risk_level ?? "",
          data?.estimated_savings ?? "",
          data?.confidence_level ?? "",
          upload.unlocked ? "YES" : "NO",
          upload.internalNote ?? "",
        ];
      }),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="effluxa-client-${client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-audits.csv"`,
      },
    });
  } catch (error) {
    console.error("CLIENT CSV EXPORT ERROR:", error);
    return NextResponse.json({ error: "Failed to export client CSV." }, { status: 500 });
  }
}
