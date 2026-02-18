/*
  Warnings:

  - You are about to drop the `InvoiceRow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentRow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceListRow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReconcileResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReconcileRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UploadBatch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InvoiceRow" DROP CONSTRAINT "InvoiceRow_batchId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentRow" DROP CONSTRAINT "PaymentRow_batchId_fkey";

-- DropForeignKey
ALTER TABLE "PriceListRow" DROP CONSTRAINT "PriceListRow_batchId_fkey";

-- DropForeignKey
ALTER TABLE "ReconcileResult" DROP CONSTRAINT "ReconcileResult_invoiceRowId_fkey";

-- DropForeignKey
ALTER TABLE "ReconcileResult" DROP CONSTRAINT "ReconcileResult_runId_fkey";

-- DropTable
DROP TABLE "InvoiceRow";

-- DropTable
DROP TABLE "OrganizationSubscription";

-- DropTable
DROP TABLE "PaymentRow";

-- DropTable
DROP TABLE "PriceListRow";

-- DropTable
DROP TABLE "ReconcileResult";

-- DropTable
DROP TABLE "ReconcileRun";

-- DropTable
DROP TABLE "UploadBatch";

-- DropEnum
DROP TYPE "ReconcileStatus";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "subscription" TEXT NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_clerkOrgId_key" ON "Organization"("clerkOrgId");
