-- CreateTable
CREATE TABLE "AuditJob" (
    "id" TEXT NOT NULL,
    "workspaceOwnerId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "clientId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "sourceBytes" BYTEA,
    "reportId" TEXT,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditJob_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditJob_status_check" CHECK ("status" IN ('QUEUED', 'PROCESSING', 'RETRYABLE', 'COMPLETE', 'FAILED'))
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditJob_workspaceOwnerId_idempotencyKey_key"
ON "AuditJob"("workspaceOwnerId", "idempotencyKey");

CREATE INDEX "AuditJob_workspaceOwnerId_status_createdAt_idx"
ON "AuditJob"("workspaceOwnerId", "status", "createdAt");

CREATE INDEX "AuditJob_status_nextAttemptAt_idx"
ON "AuditJob"("status", "nextAttemptAt");

CREATE INDEX "AuditJob_reportId_idx"
ON "AuditJob"("reportId");
