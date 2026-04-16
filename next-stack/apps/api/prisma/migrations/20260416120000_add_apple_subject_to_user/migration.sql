-- AlterTable
ALTER TABLE "User" ADD COLUMN "appleSubject" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_appleSubject_key" ON "User"("appleSubject");
