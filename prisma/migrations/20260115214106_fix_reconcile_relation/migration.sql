-- CreateEnum
CREATE TYPE "ReconcileStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERPAID', 'MISMATCH');

-- CreateTable
CREATE TABLE "ReconcileRun" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB,

    CONSTRAINT "ReconcileRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconcileResult" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "invoiceRowId" TEXT NOT NULL,
    "status" "ReconcileStatus" NOT NULL,
    "matchedPayments" JSONB,
    "paidTotal" DECIMAL(18,2) NOT NULL,
    "outstanding" DECIMAL(18,2) NOT NULL,
    "currency" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconcileResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReconcileResult_orgId_runId_idx" ON "ReconcileResult"("orgId", "runId");

-- CreateIndex
CREATE UNIQUE INDEX "ReconcileResult_runId_invoiceRowId_key" ON "ReconcileResult"("runId", "invoiceRowId");

-- AddForeignKey
ALTER TABLE "ReconcileResult" ADD CONSTRAINT "ReconcileResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReconcileRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconcileResult" ADD CONSTRAINT "ReconcileResult_invoiceRowId_fkey" FOREIGN KEY ("invoiceRowId") REFERENCES "InvoiceRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
