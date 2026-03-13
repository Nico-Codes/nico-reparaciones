-- CreateEnum
CREATE TYPE "RepairPricingSnapshotSource" AS ENUM ('RULE_ONLY', 'SUPPLIER_PART', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "RepairPricingSnapshotStatus" AS ENUM ('DRAFT', 'APPLIED', 'SUPERSEDED', 'DISCARDED');

-- AlterTable
ALTER TABLE "Repair" ADD COLUMN     "activePricingSnapshotId" TEXT;

-- CreateTable
CREATE TABLE "RepairPricingSnapshot" (
    "id" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "pricingRuleId" TEXT,
    "source" "RepairPricingSnapshotSource" NOT NULL DEFAULT 'SUPPLIER_PART',
    "status" "RepairPricingSnapshotStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierId" TEXT,
    "supplierNameSnapshot" TEXT,
    "supplierSearchQuery" TEXT,
    "supplierEndpointSnapshot" TEXT,
    "externalPartId" TEXT,
    "partSkuSnapshot" TEXT,
    "partNameSnapshot" TEXT NOT NULL,
    "partBrandSnapshot" TEXT,
    "partUrlSnapshot" TEXT,
    "partAvailabilitySnapshot" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deviceTypeIdSnapshot" TEXT,
    "deviceBrandIdSnapshot" TEXT,
    "deviceModelGroupIdSnapshot" TEXT,
    "deviceModelIdSnapshot" TEXT,
    "deviceIssueTypeIdSnapshot" TEXT,
    "deviceBrandSnapshot" TEXT,
    "deviceModelSnapshot" TEXT,
    "issueLabelSnapshot" TEXT,
    "baseCost" DECIMAL(12,2) NOT NULL,
    "extraCost" DECIMAL(12,2),
    "shippingCost" DECIMAL(12,2),
    "pricingRuleNameSnapshot" TEXT,
    "calcModeSnapshot" TEXT,
    "marginPercentSnapshot" DECIMAL(7,2),
    "minProfitSnapshot" DECIMAL(12,2),
    "minFinalPriceSnapshot" DECIMAL(12,2),
    "shippingFeeSnapshot" DECIMAL(12,2),
    "suggestedQuotedPrice" DECIMAL(12,2),
    "appliedQuotedPrice" DECIMAL(12,2),
    "manualOverridePrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "RepairPricingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepairPricingSnapshot_repairId_createdAt_idx" ON "RepairPricingSnapshot"("repairId", "createdAt");

-- CreateIndex
CREATE INDEX "RepairPricingSnapshot_status_idx" ON "RepairPricingSnapshot"("status");

-- CreateIndex
CREATE INDEX "RepairPricingSnapshot_source_idx" ON "RepairPricingSnapshot"("source");

-- CreateIndex
CREATE INDEX "RepairPricingSnapshot_supplierId_idx" ON "RepairPricingSnapshot"("supplierId");

-- CreateIndex
CREATE INDEX "RepairPricingSnapshot_pricingRuleId_idx" ON "RepairPricingSnapshot"("pricingRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "Repair_activePricingSnapshotId_key" ON "Repair"("activePricingSnapshotId");

-- CreateIndex
CREATE INDEX "Repair_activePricingSnapshotId_idx" ON "Repair"("activePricingSnapshotId");

-- AddForeignKey
ALTER TABLE "Repair" ADD CONSTRAINT "Repair_activePricingSnapshotId_fkey" FOREIGN KEY ("activePricingSnapshotId") REFERENCES "RepairPricingSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPricingSnapshot" ADD CONSTRAINT "RepairPricingSnapshot_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "Repair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPricingSnapshot" ADD CONSTRAINT "RepairPricingSnapshot_pricingRuleId_fkey" FOREIGN KEY ("pricingRuleId") REFERENCES "RepairPricingRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairPricingSnapshot" ADD CONSTRAINT "RepairPricingSnapshot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;