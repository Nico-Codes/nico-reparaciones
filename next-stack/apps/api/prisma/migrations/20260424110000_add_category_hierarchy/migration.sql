-- AlterTable
ALTER TABLE "Category"
ADD COLUMN "parent_id" TEXT;

-- CreateIndex
CREATE INDEX "Category_parent_id_idx" ON "Category"("parent_id");

-- AddForeignKey
ALTER TABLE "Category"
ADD CONSTRAINT "Category_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "Category"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed minimal parent/child regrouping
INSERT INTO "Category" ("id", "name", "slug", "parent_id", "active", "createdAt", "updatedAt")
VALUES ('sys-category-accesorios', 'Accesorios', 'accesorios', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name",
    "active" = true,
    "parent_id" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Category" AS child
SET "parent_id" = parent."id",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Category" AS parent
WHERE parent."slug" = 'accesorios'
  AND child."slug" IN ('cables', 'cargadores', 'templados')
  AND child."id" <> parent."id";
