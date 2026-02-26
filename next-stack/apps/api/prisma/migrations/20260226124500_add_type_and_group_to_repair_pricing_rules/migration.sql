-- AlterTable
ALTER TABLE "RepairPricingRule"
ADD COLUMN "deviceTypeId" TEXT,
ADD COLUMN "deviceModelGroupId" TEXT;

-- CreateIndex
CREATE INDEX "RepairPricingRule_deviceTypeId_idx" ON "RepairPricingRule"("deviceTypeId");
CREATE INDEX "RepairPricingRule_deviceModelGroupId_idx" ON "RepairPricingRule"("deviceModelGroupId");

-- AddForeignKey
ALTER TABLE "RepairPricingRule"
ADD CONSTRAINT "RepairPricingRule_deviceTypeId_fkey"
FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RepairPricingRule"
ADD CONSTRAINT "RepairPricingRule_deviceModelGroupId_fkey"
FOREIGN KEY ("deviceModelGroupId") REFERENCES "DeviceModelGroup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
