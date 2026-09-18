-- CreateTable
CREATE TABLE "FindingReview" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "workspaceOwnerId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FindingReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FindingReview_verdict_check" CHECK ("verdict" IN ('TRUE', 'FALSE', 'UNCLEAR'))
);

-- CreateIndex
CREATE UNIQUE INDEX "FindingReview_reportId_findingId_reviewerUserId_key"
ON "FindingReview"("reportId", "findingId", "reviewerUserId");

CREATE INDEX "FindingReview_workspaceOwnerId_verdict_idx"
ON "FindingReview"("workspaceOwnerId", "verdict");

CREATE INDEX "FindingReview_reportId_findingId_idx"
ON "FindingReview"("reportId", "findingId");

CREATE INDEX "FindingReview_reviewerUserId_createdAt_idx"
ON "FindingReview"("reviewerUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "FindingReview"
ADD CONSTRAINT "FindingReview_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
