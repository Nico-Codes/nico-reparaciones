-- AlterTable
ALTER TABLE "Repair" ADD COLUMN "deviceTypeId" TEXT;

-- CreateIndex
CREATE INDEX "Repair_deviceTypeId_idx" ON "Repair"("deviceTypeId");

-- AddForeignKey
ALTER TABLE "Repair"
ADD CONSTRAINT "Repair_deviceTypeId_fkey"
FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
