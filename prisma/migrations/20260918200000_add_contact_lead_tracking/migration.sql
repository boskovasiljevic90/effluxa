ALTER TABLE "ContactMessage"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'general_support',
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NEW';

CREATE INDEX "ContactMessage_source_status_createdAt_idx"
ON "ContactMessage"("source", "status", "createdAt");
