-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "purchase_reference" TEXT,
ADD COLUMN "supplier_id" TEXT;

-- CreateIndex
CREATE INDEX "Product_supplier_id_idx" ON "Product"("supplier_id");

-- AddForeignKey
ALTER TABLE "Product"
ADD CONSTRAINT "Product_supplier_id_fkey"
FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
