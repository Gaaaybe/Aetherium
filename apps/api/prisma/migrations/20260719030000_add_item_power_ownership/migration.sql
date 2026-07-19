-- Aditivo e retrocompatível: vínculos existentes continuam sendo referências.
ALTER TABLE "item_powers"
ADD COLUMN "ownsPower" BOOLEAN NOT NULL DEFAULT false;

-- Cópias de personagem inequivocamente isoladas já pertencem ao respectivo item.
UPDATE "item_powers" AS ip
SET "ownsPower" = true
FROM "items" AS i, "powers" AS p
WHERE ip."itemId" = i.id
  AND ip."powerId" = p.id
  AND i."characterId" IS NOT NULL
  AND p."characterId" = i."characterId"
  AND (
    SELECT COUNT(*)
    FROM "item_powers" AS refs
    WHERE refs."powerId" = ip."powerId"
  ) = 1;
