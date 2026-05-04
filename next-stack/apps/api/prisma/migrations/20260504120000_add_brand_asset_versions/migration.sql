CREATE TABLE "BrandAssetVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slot" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "originalName" TEXT,
  "mimeType" TEXT,
  "size" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL DEFAULT 'upload',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BrandAssetVersion_slot_idx" ON "BrandAssetVersion"("slot");
CREATE INDEX "BrandAssetVersion_slot_isActive_idx" ON "BrandAssetVersion"("slot", "isActive");
