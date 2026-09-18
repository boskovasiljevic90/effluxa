ALTER TABLE "ContactMessage"
ADD COLUMN "nextActionAt" TIMESTAMP(3),
ADD COLUMN "internalNote" TEXT;

CREATE INDEX "ContactMessage_source_status_nextActionAt_idx"
ON "ContactMessage"("source", "status", "nextActionAt");
