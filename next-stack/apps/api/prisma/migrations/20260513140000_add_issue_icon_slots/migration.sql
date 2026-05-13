-- Add configurable icon slot for repair issue types.
ALTER TABLE "DeviceIssueType" ADD COLUMN "iconSlot" TEXT;

CREATE INDEX "DeviceIssueType_iconSlot_idx" ON "DeviceIssueType"("iconSlot");
