-- AlterEnum
ALTER TYPE "RepairPricingSnapshotSource" ADD VALUE IF NOT EXISTS 'INTERNAL_STOCK';

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "publishedToStore" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "repairUsageEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RepairPricingSnapshot"
ADD COLUMN "internalProductId" TEXT,
ADD COLUMN "internalProductNameSnapshot" TEXT,
ADD COLUMN "internalProductSkuSnapshot" TEXT,
ADD COLUMN "internalProductApplicabilityId" TEXT,
ADD COLUMN "internalProductStockBefore" INTEGER,
ADD COLUMN "internalProductStockAfter" INTEGER;

-- CreateTable
CREATE TABLE "RepairPartApplicability" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "deviceTypeId" TEXT,
    "deviceBrandId" TEXT,
    "deviceModelGroupId" TEXT,
    "deviceModelId" TEXT,
    "deviceIssueTypeId" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairPartApplicability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "repairId" TEXT,
    "pricingSnapshotId" TEXT,
    "type" TEXT NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "stockBefore" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_publishedToStore_active_idx" ON "Product"("publishedToStore", "active");

-- CreateIndex
CREATE INDEX "Product_repairUsageEnabled_active_idx" ON "Product"("repairUsageEnabled", "active");

-- CreateIndex
CREATE INDEX "RepairPricingSnapshot_internalProductId_idx" ON "RepairPricingSnapshot"("internalProductId");

-- CreateIndex
CREATE INDEX "RepairPartApplicability_productId_active_idx" ON "RepairPartApplicability"("productId", "active");

-- CreateIndex
CREATE INDEX "RepairPartApplicability_deviceTypeId_idx" ON "RepairPartApplicability"("deviceTypeId");

-- CreateIndex
CREATE INDEX "RepairPartApplicability_deviceBrandId_idx" ON "RepairPartApplicability"("deviceBrandId");

-- CreateIndex
CREATE INDEX "RepairPartApplicability_deviceModelGroupId_idx" ON "RepairPartApplicability"("deviceModelGroupId");

-- CreateIndex
CREATE INDEX "RepairPartApplicability_deviceModelId_idx" ON "RepairPartApplicability"("deviceModelId");

-- CreateIndex
CREATE INDEX "RepairPartApplicability_deviceIssueTypeId_idx" ON "RepairPartApplicability"("deviceIssueTypeId");

-- CreateIndex
CREATE INDEX "ProductStockMovement_productId_createdAt_idx" ON "ProductStockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductStockMovement_repairId_createdAt_idx" ON "ProductStockMovement"("repairId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductStockMovement_pricingSnapshotId_idx" ON "ProductStockMovement"("pricingSnapshotId");

-- CreateIndex
CREATE INDEX "ProductStockMovement_type_idx" ON "ProductStockMovement"("type");

-- AddForeignKey
ALTER TABLE "RepairPricingSnapshot"
ADD CONSTRAINT "RepairPricingSnapshot_internalProductId_fkey"
FOREIGN KEY ("internalProductId") REFERENCES "Product"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPartApplicability"
ADD CONSTRAINT "RepairPartApplicability_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockMovement"
ADD CONSTRAINT "ProductStockMovement_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockMovement"
ADD CONSTRAINT "ProductStockMovement_repairId_fkey"
FOREIGN KEY ("repairId") REFERENCES "Repair"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockMovement"
ADD CONSTRAINT "ProductStockMovement_pricingSnapshotId_fkey"
FOREIGN KEY ("pricingSnapshotId") REFERENCES "RepairPricingSnapshot"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
