import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeVerifyToken } from "@/lib/auth";
import { getWorkspaceOwner } from "@/lib/workspace";

export const dynamic = "force-dynamic";

function serializeJob(job: {
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  reportId: string | null;
  lastError: string | null;
  nextAttemptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: job.id,
    fileName: job.fileName,
    fileSize: job.fileSize,
    status: job.status,
    attemptCount: job.attemptCount,
    maxAttempts: job.maxAttempts,
    reportId: job.reportId,
    lastError: job.lastError,
    nextAttemptAt: job.nextAttemptAt?.toISOString() || null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get("token")?.value;
    const decoded = token ? safeVerifyToken(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workspace = await getWorkspaceOwner(user);
    const job = await prisma.auditJob.findFirst({
      where: {
        id: params.id,
        workspaceOwnerId: workspace.owner.id,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        status: true,
        attemptCount: true,
        maxAttempts: true,
        reportId: true,
        lastError: true,
        nextAttemptAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Audit job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: serializeJob(job),
      pollAfterMs: 2500,
    });
  } catch (error) {
    console.error("AUDIT JOB STATUS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to read audit job status." },
      { status: 500 }
    );
  }
}
