ALTER TABLE "User" ADD COLUMN "complimentaryAgencyAccessUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "complimentaryAgencyAccessGrantedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "complimentaryAgencyAccessRevokedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "complimentaryAgencyAccessReason" TEXT;
