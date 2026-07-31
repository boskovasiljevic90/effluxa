export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getWorkspaceOwner } from "@/lib/workspace";
import { canAccessFullReport } from "@/lib/access";

function csvEscape(value: any) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const workspace = await getWorkspaceOwner(user);

    const reports = await prisma.upload.findMany({
      where: { userId: workspace.owner.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    const accessibleReports = reports.filter((report) =>
      canAccessFullReport({ report, user, workspace })
    );

    const rows = [
      ["Client", "File", "Date", "Leakage Score", "Risk Level", "Estimated Savings", "Confidence", "Unlocked", "Internal Note"],
      ...accessibleReports.map((report) => {
        const data = report.parsedData as any;

        return [
          report.client?.name || "",
          report.fileUrl,
          report.createdAt.toISOString(),
          data?.leakage_score ?? "",
          data?.risk_level ?? "",
          data?.estimated_savings ?? "",
          data?.confidence_level ?? "",
          report.unlocked ? "YES" : "NO",
          report.internalNote ?? "",
        ];
      }),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="effluxa-workspace-audits.csv"`,
      },
    });
  } catch (error) {
    console.error("WORKSPACE CSV EXPORT ERROR:", error);
    return NextResponse.json({ error: "Failed to export workspace CSV." }, { status: 500 });
  }
}
