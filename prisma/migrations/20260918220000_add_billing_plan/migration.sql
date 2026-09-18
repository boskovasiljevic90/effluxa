ALTER TABLE "User"
ADD COLUMN "billingPlan" TEXT;

CREATE INDEX "User_billingPlan_subscriptionStatus_idx"
ON "User"("billingPlan", "subscriptionStatus");
