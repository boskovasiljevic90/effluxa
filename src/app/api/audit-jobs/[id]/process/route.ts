import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeVerifyToken } from "@/lib/auth";
import { getWorkspaceOwner } from "@/lib/workspace";
import { rateLimit } from "@/lib/rateLimit";
import { processAuditJob } from "@/lib/auditJobProcessor";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(
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

    const limited = rateLimit({
      req,
      key: "audit_job_process:" + user.id,
      limit: 8,
      windowMs: 60000,
    });

    if (limited) return limited;

    const workspace = await getWorkspaceOwner(user);
    const job = await prisma.auditJob.findFirst({
      where: {
        id: params.id,
        workspaceOwnerId: workspace.owner.id,
      },
      select: {
        id: true,
        status: true,
        reportId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Audit job not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const manualRetry = body?.retry === true;

    if (manualRetry && (job.status === "FAILED" || job.status === "RETRYABLE")) {
      // One-click retries used to reset the attempt counter with no ceiling,
      // which allowed an unlimited number of paid AI runs. A manual retry now
      // has its own small daily budget per account.
      const retryLimited = rateLimit({
        req,
        key: "audit_job_retry:" + user.id,
        limit: 3,
        windowMs: 24 * 60 * 60 * 1000,
      });

      if (retryLimited) return retryLimited;

      await prisma.auditJob.updateMany({
        where: {
          id: job.id,
          workspaceOwnerId: workspace.owner.id,
          status: { in: ["FAILED", "RETRYABLE"] },
        },
        data: {
          status: "QUEUED",
          attemptCount: 0,
          lastError: null,
          nextAttemptAt: null,
          lockedAt: null,
        },
      });
    }

    const result = await processAuditJob(job.id);

    if (result.status === "NOT_FOUND") {
      return NextResponse.json({ error: "Audit job not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: result.status !== "FAILED",
        job: result,
      },
      {
        status: result.status === "COMPLETE" || result.status === "FAILED" ? 200 : 202,
      }
    );
  } catch (error) {
    console.error("AUDIT JOB PROCESS ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to process audit job." },
      { status: 500 }
    );
  }
}
