-- CreateTable
CREATE TABLE "DeviceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeviceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceModelGroup" (
    "id" TEXT NOT NULL,
    "deviceBrandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeviceModelGroup_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "DeviceBrand" ADD COLUMN "deviceTypeId" TEXT;
ALTER TABLE "DeviceIssueType" ADD COLUMN "deviceTypeId" TEXT;
ALTER TABLE "DeviceModel" ADD COLUMN "deviceModelGroupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceType_slug_key" ON "DeviceType"("slug");
CREATE INDEX "DeviceType_active_idx" ON "DeviceType"("active");
CREATE INDEX "DeviceBrand_deviceTypeId_idx" ON "DeviceBrand"("deviceTypeId");
CREATE INDEX "DeviceIssueType_deviceTypeId_idx" ON "DeviceIssueType"("deviceTypeId");
CREATE INDEX "DeviceModel_deviceModelGroupId_idx" ON "DeviceModel"("deviceModelGroupId");
CREATE INDEX "DeviceModelGroup_deviceBrandId_active_idx" ON "DeviceModelGroup"("deviceBrandId", "active");
CREATE UNIQUE INDEX "DeviceModelGroup_deviceBrandId_slug_key" ON "DeviceModelGroup"("deviceBrandId", "slug");

-- AddForeignKey
ALTER TABLE "DeviceBrand"
ADD CONSTRAINT "DeviceBrand_deviceTypeId_fkey"
FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeviceIssueType"
ADD CONSTRAINT "DeviceIssueType_deviceTypeId_fkey"
FOREIGN KEY ("deviceTypeId") REFERENCES "DeviceType"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeviceModel"
ADD CONSTRAINT "DeviceModel_deviceModelGroupId_fkey"
FOREIGN KEY ("deviceModelGroupId") REFERENCES "DeviceModelGroup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeviceModelGroup"
ADD CONSTRAINT "DeviceModelGroup_deviceBrandId_fkey"
FOREIGN KEY ("deviceBrandId") REFERENCES "DeviceBrand"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
