ALTER TABLE "ControlAction" ADD COLUMN "lastReminderAt" TIMESTAMP(3);
ALTER TABLE "ControlAction" ADD COLUMN "lastReminderKind" TEXT;

CREATE INDEX "ControlAction_status_dueDate_lastReminderAt_idx"
ON "ControlAction"("status", "dueDate", "lastReminderAt");
