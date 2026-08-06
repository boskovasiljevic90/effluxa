ALTER TABLE "User" RENAME COLUMN "stripeCustomerId" TO "legacyPaymentCustomerId";
ALTER TABLE "User" RENAME COLUMN "subscriptionId" TO "legacyPaymentSubscriptionId";
ALTER TABLE "User" ADD COLUMN "paddleCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "paddleSubscriptionId" TEXT;
ALTER TABLE "Upload" RENAME COLUMN "checkoutSessionId" TO "legacyPaymentReference";
ALTER TABLE "Upload" ADD COLUMN "checkoutTransactionId" TEXT;
