CREATE TYPE "CharacterResourceStyle" AS ENUM ('BAR', 'DOTS', 'COUNTER');

CREATE TABLE "character_resources" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "style" "CharacterResourceStyle" NOT NULL DEFAULT 'COUNTER',
    "color" TEXT NOT NULL DEFAULT 'indigo',
    "current" INTEGER NOT NULL DEFAULT 0,
    "minimum" INTEGER NOT NULL DEFAULT 0,
    "maximum" INTEGER,
    "step" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "character_resources_characterId_position_idx"
ON "character_resources"("characterId", "position");

ALTER TABLE "character_resources"
ADD CONSTRAINT "character_resources_characterId_fkey"
FOREIGN KEY ("characterId") REFERENCES "characters"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
