ALTER TABLE "WhatsAppLog"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "remoteMessageId" TEXT,
  ADD COLUMN "providerStatus" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3);

ALTER TABLE "WhatsAppLog"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

UPDATE "WhatsAppLog"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS DISTINCT FROM "createdAt";

CREATE UNIQUE INDEX "WhatsAppLog_remoteMessageId_key" ON "WhatsAppLog"("remoteMessageId");
CREATE INDEX "WhatsAppLog_status_createdAt_idx" ON "WhatsAppLog"("status", "createdAt");
CREATE INDEX "WhatsAppLog_providerStatus_createdAt_idx" ON "WhatsAppLog"("providerStatus", "createdAt");
