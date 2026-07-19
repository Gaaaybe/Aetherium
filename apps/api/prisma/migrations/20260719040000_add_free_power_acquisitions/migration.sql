ALTER TABLE "character_powers"
ADD COLUMN "isFreeAcquisition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acquisitionNote" TEXT;

ALTER TABLE "character_power_arrays"
ADD COLUMN "isFreeAcquisition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acquisitionNote" TEXT;
