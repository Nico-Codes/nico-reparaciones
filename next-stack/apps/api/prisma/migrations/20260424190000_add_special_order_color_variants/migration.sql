ALTER TABLE "OrderItem"
  ADD COLUMN "selectedColorVariantId" TEXT,
  ADD COLUMN "selectedColorLabelSnapshot" TEXT;

ALTER TABLE "SpecialOrderImportProfile"
  ADD COLUMN "defaultColorSheetUrl" TEXT,
  ADD COLUMN "rememberColorSheet" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ProductColorVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "normalizedLabel" TEXT NOT NULL,
  "supplierAvailability" "SupplierAvailability" NOT NULL DEFAULT 'UNKNOWN',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastImportedAt" TIMESTAMP(3),
  "sourceSheetRow" INTEGER,
  "sourceSheetKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductColorVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductColorVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProductColorVariant_productId_active_idx" ON "ProductColorVariant"("productId", "active");
CREATE UNIQUE INDEX "ProductColorVariant_productId_normalizedLabel_key" ON "ProductColorVariant"("productId", "normalizedLabel");
CREATE UNIQUE INDEX "ProductColorVariant_productId_sourceSheetKey_key" ON "ProductColorVariant"("productId", "sourceSheetKey");
