import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processAuditJob } from "@/lib/auditJobProcessor";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  return Boolean(
    expectedSecret &&
      req.headers.get("authorization") === "Bearer " + expectedSecret
  );
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 8 * 60 * 1000);
    const candidate = await prisma.auditJob.findFirst({
      where: {
        OR: [
          { status: "QUEUED" },
          {
            status: "RETRYABLE",
            OR: [
              { nextAttemptAt: null },
              { nextAttemptAt: { lte: now } },
            ],
          },
          {
            status: "PROCESSING",
            lockedAt: { lt: staleBefore },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json({
        success: true,
        processed: 0,
      });
    }

    const result = await processAuditJob(candidate.id);

    return NextResponse.json({
      success: true,
      processed: result.status === "COMPLETE" ? 1 : 0,
      job: result,
    });
  } catch (error) {
    console.error("AUDIT JOB CRON ERROR:", error);
    return NextResponse.json(
      { error: "Audit job worker failed." },
      { status: 500 }
    );
  }
}
