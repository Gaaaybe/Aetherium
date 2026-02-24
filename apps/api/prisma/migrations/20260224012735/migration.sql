/*
  Warnings:

  - You are about to drop the column `custom` on the `powers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "powers_custom_idx";

-- AlterTable
ALTER TABLE "peculiarities" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "power_arrays" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "powers" DROP COLUMN "custom",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "peculiarities_isPublic_idx" ON "peculiarities"("isPublic");

-- CreateIndex
CREATE INDEX "peculiarities_userId_isPublic_idx" ON "peculiarities"("userId", "isPublic");

-- CreateIndex
CREATE INDEX "power_arrays_userId_idx" ON "power_arrays"("userId");

-- CreateIndex
CREATE INDEX "power_arrays_isPublic_idx" ON "power_arrays"("isPublic");

-- CreateIndex
CREATE INDEX "power_arrays_userId_isPublic_idx" ON "power_arrays"("userId", "isPublic");

-- CreateIndex
CREATE INDEX "powers_userId_idx" ON "powers"("userId");

-- CreateIndex
CREATE INDEX "powers_isPublic_idx" ON "powers"("isPublic");

-- CreateIndex
CREATE INDEX "powers_userId_isPublic_idx" ON "powers"("userId", "isPublic");

-- AddForeignKey
ALTER TABLE "powers" ADD CONSTRAINT "powers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_arrays" ADD CONSTRAINT "power_arrays_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
