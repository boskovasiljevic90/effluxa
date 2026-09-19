import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";
import { sendAdminNotificationEmail } from "@/lib/email";
import { processAuditFile } from "@/lib/auditProcessing";

const STALE_LOCK_MS = 8 * 60 * 1000;

type JobStatus = "QUEUED" | "PROCESSING" | "RETRYABLE" | "COMPLETE" | "FAILED";

export type AuditJobResult = {
  status: JobStatus | "NOT_FOUND";
  reportId?: string | null;
  error?: string | null;
  nextAttemptAt?: string | null;
};

function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();

  return (
    message.includes("429") ||
    normalized.includes("quota") ||
    normalized.includes("billing") ||
    normalized.includes("insufficient_quota") ||
    normalized.includes("rate_limit")
  );
}

function userFacingError(error: unknown) {
  if (isQuotaError(error)) {
    return "AI analysis is temporarily unavailable. The audit is queued for retry.";
  }

  return "We couldn't complete this audit. You can retry it from Reports.";
}

function jobResult(job: {
  status: string;
  reportId: string | null;
  lastError: string | null;
  nextAttemptAt: Date | null;
}): AuditJobResult {
  return {
    status: job.status as JobStatus,
    reportId: job.reportId,
    error: job.lastError,
    nextAttemptAt: job.nextAttemptAt?.toISOString() || null,
  };
}

export async function processAuditJob(jobId: string): Promise<AuditJobResult> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
  const initial = await prisma.auditJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      reportId: true,
      lastError: true,
      nextAttemptAt: true,
      lockedAt: true,
    },
  });

  if (!initial) return { status: "NOT_FOUND" };
  if (initial.status === "COMPLETE") return jobResult(initial);

  if (
    initial.status === "PROCESSING" &&
    initial.lockedAt &&
    initial.lockedAt > staleBefore
  ) {
    return jobResult(initial);
  }

  if (
    initial.status === "RETRYABLE" &&
    initial.nextAttemptAt &&
    initial.nextAttemptAt > now
  ) {
    return jobResult(initial);
  }

  const claimed = await prisma.auditJob.updateMany({
    where: {
      id: jobId,
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
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      lockedAt: now,
      startedAt: now,
      lastError: null,
      nextAttemptAt: null,
    },
  });

  if (claimed.count !== 1) {
    const current = await prisma.auditJob.findUnique({
      where: { id: jobId },
      select: {
        status: true,
        reportId: true,
        lastError: true,
        nextAttemptAt: true,
      },
    });

    return current ? jobResult(current) : { status: "NOT_FOUND" };
  }

  const job = await prisma.auditJob.findUnique({
    where: { id: jobId },
  });

  if (!job || job.status !== "PROCESSING") {
    return job ? jobResult(job) : { status: "NOT_FOUND" };
  }

  await trackEvent({
    type: "audit_job_started",
    userId: job.createdByUserId,
    metadata: {
      auditJobId: job.id,
      attemptCount: job.attemptCount,
      workspaceOwnerId: job.workspaceOwnerId,
    },
  });

  try {
    if (!job.sourceBytes) {
      throw new Error("Audit job source file is no longer available.");
    }

    const file = new File(
      [new Uint8Array(job.sourceBytes)],
      job.fileName,
      { type: job.fileType || "application/octet-stream" }
    );
    const result = await processAuditFile({
      file,
      fileName: job.fileName,
      language: job.language,
    });
    const reportData =
      result.parsedData &&
      typeof result.parsedData === "object" &&
      !Array.isArray(result.parsedData)
        ? result.parsedData as Record<string, any>
        : null;
    const reportQuality =
      reportData?.report_quality &&
      typeof reportData.report_quality === "object" &&
      !Array.isArray(reportData.report_quality)
        ? reportData.report_quality
        : null;

    let clientAuditNumber = 1;
    const upload = await prisma.$transaction(async (tx) => {
      if (job.clientId) {
        const previousClientAudits = await tx.upload.count({
          where: {
            userId: job.workspaceOwnerId,
            clientId: job.clientId,
          },
        });
        clientAuditNumber = previousClientAudits + 1;
      }

      const createdUpload = await tx.upload.create({
        data: {
          userId: job.workspaceOwnerId,
          fileUrl: job.fileName,
          parsedData: result.parsedData,
          summary: "AI financial leak audit generated",
          clientId: job.clientId,
        },
      });

      const completed = await tx.auditJob.updateMany({
        where: {
          id: job.id,
          status: "PROCESSING",
        },
        data: {
          status: "COMPLETE",
          reportId: createdUpload.id,
          sourceBytes: null,
          lastError: null,
          lockedAt: null,
          completedAt: new Date(),
          nextAttemptAt: null,
        },
      });

      if (completed.count !== 1) {
        throw new Error("Audit job claim was lost before completion.");
      }

      return createdUpload;
    });

    await trackEvent({
      type: "upload_created",
      userId: job.createdByUserId,
      reportId: upload.id,
      metadata: {
        fileName: job.fileName,
        fileSize: job.fileSize,
        analysisVersion:
          reportData && typeof reportData.analysisVersion === "string"
            ? reportData.analysisVersion
            : "1.0",
        auditEngine: result.auditEngine,
        analysisPath: reportQuality?.analysis_path || null,
        analysisDurationMs: reportQuality?.analysis_duration_ms || result.analysisDurationMs,
        fallbackUsed: result.fallbackUsed,
        findingCount: Array.isArray(reportData?.findings)
          ? reportData.findings.length
          : null,
        extractedRecordCount: reportQuality?.extracted_record_count || null,
        workspaceOwnerId: job.workspaceOwnerId,
        clientId: job.clientId,
        clientAuditNumber,
        repeatAudit: Boolean(job.clientId && clientAuditNumber > 1),
      },
    });

    await trackEvent({
      type: "audit_job_completed",
      userId: job.createdByUserId,
      reportId: upload.id,
      metadata: {
        auditJobId: job.id,
        attemptCount: job.attemptCount,
        auditEngine: result.auditEngine,
        analysisDurationMs: result.analysisDurationMs,
      },
    });

    return {
      status: "COMPLETE",
      reportId: upload.id,
      error: null,
      nextAttemptAt: null,
    };
  } catch (error) {
    console.error("AUDIT JOB PROCESSING ERROR:", error);
    await trackError({
      type: "audit_job_processing_error",
      userId: job.createdByUserId,
      error,
      metadata: {
        auditJobId: job.id,
        attemptCount: job.attemptCount,
        workspaceOwnerId: job.workspaceOwnerId,
      },
    });

    const canRetry = job.attemptCount < job.maxAttempts;
    const nextAttemptAt = canRetry
      ? new Date(Date.now() + Math.min(15 * 60 * 1000, Math.max(30 * 1000, job.attemptCount * 60 * 1000)))
      : null;
    const message = userFacingError(error);
    const status = canRetry ? "RETRYABLE" : "FAILED";

    const failed = await prisma.auditJob.updateMany({
      where: {
        id: job.id,
        status: "PROCESSING",
      },
      data: {
        status,
        lastError: message,
        lockedAt: null,
        nextAttemptAt,
      },
    });

    if (failed.count === 1) {
      await trackEvent({
        type: "audit_job_failed",
        userId: job.createdByUserId,
        metadata: {
          auditJobId: job.id,
          attemptCount: job.attemptCount,
          retryable: canRetry,
          workspaceOwnerId: job.workspaceOwnerId,
        },
      });
    }

    if (isQuotaError(error) && job.attemptCount === 1) {
      try {
        await sendAdminNotificationEmail({
          subject: "🚨 Effluxa AI processing unavailable",
          body: `AI processing is currently unavailable for an audit job.\n\nTime:\n${new Date().toISOString()}`,
        });
      } catch (emailError) {
        console.error("ADMIN AI ALERT EMAIL ERROR:", emailError);
      }
    }

    return {
      status,
      reportId: null,
      error: message,
      nextAttemptAt: nextAttemptAt?.toISOString() || null,
    };
  }
}
