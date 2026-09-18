CREATE TABLE "ControlAction" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "workspaceOwnerId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "findingId" TEXT NOT NULL,
    "findingTitle" TEXT NOT NULL,
    "ruleId" TEXT,
    "findingCategory" TEXT,
    "findingSeverity" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "quantifiedAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ownerEmail" TEXT,
    "dueDate" TIMESTAMP(3),
    "outcomeNote" TEXT,
    "resolvedAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ControlAction_reportId_findingId_key" ON "ControlAction"("reportId", "findingId");
CREATE INDEX "ControlAction_workspaceOwnerId_status_idx" ON "ControlAction"("workspaceOwnerId", "status");
CREATE INDEX "ControlAction_reportId_status_idx" ON "ControlAction"("reportId", "status");

ALTER TABLE "ControlAction" ADD CONSTRAINT "ControlAction_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
