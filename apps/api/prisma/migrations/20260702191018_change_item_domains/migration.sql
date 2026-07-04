-- AlterTable: add columns as nullable arrays without defaults
ALTER TABLE "items" ADD COLUMN "domainPeculiarIds" TEXT[];
ALTER TABLE "items" ADD COLUMN "domains" "DomainName"[];

-- Migrate data:
-- 1. If domainName is not null, put it into domains array
UPDATE "items"
SET "domains" = ARRAY["domainName"]::"DomainName"[]
WHERE "domainName" IS NOT NULL;

-- 2. If domainPeculiarId is not null, put it into domainPeculiarIds array
UPDATE "items"
SET "domainPeculiarIds" = ARRAY["domainPeculiarId"]
WHERE "domainPeculiarId" IS NOT NULL;

-- 3. Set remaining null arrays to empty arrays
UPDATE "items" SET "domains" = ARRAY[]::"DomainName"[] WHERE "domains" IS NULL;
UPDATE "items" SET "domainPeculiarIds" = ARRAY[]::TEXT[] WHERE "domainPeculiarIds" IS NULL;

-- 4. Set columns to NOT NULL to match Prisma's array schema mapping
ALTER TABLE "items" ALTER COLUMN "domainPeculiarIds" SET NOT NULL;
ALTER TABLE "items" ALTER COLUMN "domains" SET NOT NULL;

-- Drop index
DROP INDEX IF EXISTS "items_domainName_idx";

-- Drop old columns
ALTER TABLE "items" DROP COLUMN "domainName",
DROP COLUMN "domainPeculiarId";
