-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceRow" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "invoiceNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "counterparty" TEXT,
    "reference" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRow" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "paymentRef" TEXT,
    "paymentDate" TIMESTAMP(3),
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "counterparty" TEXT,
    "reference" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListRow" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT,
    "unitPrice" DECIMAL(65,30),
    "currency" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceListRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceRow_orgId_idx" ON "InvoiceRow"("orgId");

-- CreateIndex
CREATE INDEX "InvoiceRow_batchId_idx" ON "InvoiceRow"("batchId");

-- CreateIndex
CREATE INDEX "PaymentRow_orgId_idx" ON "PaymentRow"("orgId");

-- CreateIndex
CREATE INDEX "PaymentRow_batchId_idx" ON "PaymentRow"("batchId");

-- CreateIndex
CREATE INDEX "PriceListRow_orgId_idx" ON "PriceListRow"("orgId");

-- CreateIndex
CREATE INDEX "PriceListRow_batchId_idx" ON "PriceListRow"("batchId");

-- AddForeignKey
ALTER TABLE "InvoiceRow" ADD CONSTRAINT "InvoiceRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRow" ADD CONSTRAINT "PaymentRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListRow" ADD CONSTRAINT "PriceListRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
