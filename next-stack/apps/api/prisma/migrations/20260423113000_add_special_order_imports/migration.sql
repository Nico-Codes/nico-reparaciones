-- CreateEnum
CREATE TYPE "ProductFulfillmentMode" AS ENUM ('INVENTORY', 'SPECIAL_ORDER');

-- CreateEnum
CREATE TYPE "SupplierAvailability" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN');

-- AlterTable
ALTER TABLE "OrderItem"
ADD COLUMN "fulfillmentModeSnapshot" "ProductFulfillmentMode" NOT NULL DEFAULT 'INVENTORY';

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "fulfillmentMode" "ProductFulfillmentMode" NOT NULL DEFAULT 'INVENTORY',
ADD COLUMN "lastImportedAt" TIMESTAMP(3),
ADD COLUMN "sourcePriceUsd" DECIMAL(12,2),
ADD COLUMN "specialOrderProfileId" TEXT,
ADD COLUMN "specialOrderSourceKey" TEXT,
ADD COLUMN "supplierAvailability" "SupplierAvailability" NOT NULL DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "WhatsAppLog"
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SpecialOrderImportProfile" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultUsdRate" DECIMAL(12,4) NOT NULL,
    "defaultShippingUsd" DECIMAL(12,4) NOT NULL,
    "fallbackMarginPercent" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "sectionCategoryMapJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialOrderImportProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialOrderImportBatch" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "usdRate" DECIMAL(12,4) NOT NULL,
    "shippingUsd" DECIMAL(12,4) NOT NULL,
    "summaryJson" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialOrderImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialOrderImportProfile_active_supplierId_idx" ON "SpecialOrderImportProfile"("active", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialOrderImportProfile_supplierId_name_key" ON "SpecialOrderImportProfile"("supplierId", "name");

-- CreateIndex
CREATE INDEX "SpecialOrderImportBatch_profileId_createdAt_idx" ON "SpecialOrderImportBatch"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_fulfillmentMode_active_idx" ON "Product"("fulfillmentMode", "active");

-- CreateIndex
CREATE INDEX "Product_specialOrderProfileId_idx" ON "Product"("specialOrderProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_specialOrderProfileId_specialOrderSourceKey_key"
ON "Product"("specialOrderProfileId", "specialOrderSourceKey");

-- AddForeignKey
ALTER TABLE "Product"
ADD CONSTRAINT "Product_specialOrderProfileId_fkey"
FOREIGN KEY ("specialOrderProfileId") REFERENCES "SpecialOrderImportProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialOrderImportProfile"
ADD CONSTRAINT "SpecialOrderImportProfile_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialOrderImportBatch"
ADD CONSTRAINT "SpecialOrderImportBatch_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "SpecialOrderImportProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
