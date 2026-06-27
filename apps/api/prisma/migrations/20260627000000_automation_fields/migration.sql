-- Fase 1 de automação: campos de behavior nos catálogos e tabela de estado efêmero de cena

-- EffectBase: campo behavior para o EfeitoBehavior serializado
ALTER TABLE "effect_bases"
  ADD COLUMN "behavior" JSONB;

-- ModificationBase: campos de automação de targeting e efeito no conjurador
ALTER TABLE "modification_bases"
  ADD COLUMN "targetingEffect" TEXT NOT NULL DEFAULT 'NENHUM',
  ADD COLUMN "casterEffect"    TEXT NOT NULL DEFAULT 'NENHUM',
  ADD COLUMN "markerCondition" TEXT;

CREATE INDEX "modification_bases_targetingEffect_idx" ON "modification_bases"("targetingEffect");

-- SceneEffectInstance: estado efêmero de cena (marcadores, gatilhos)
CREATE TABLE "scene_effect_instances" (
  "id"                TEXT         NOT NULL,
  "sceneId"           TEXT         NOT NULL,
  "kind"              TEXT         NOT NULL,
  "sourceCharacterId" TEXT         NOT NULL,
  "targetCharacterId" TEXT,
  "sourcePowerId"     TEXT         NOT NULL,
  "payload"           JSONB        NOT NULL,
  "expiresAt"         TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scene_effect_instances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scene_effect_instances_sceneId_idx"
  ON "scene_effect_instances"("sceneId");

CREATE INDEX "scene_effect_instances_sceneId_targetCharacterId_idx"
  ON "scene_effect_instances"("sceneId", "targetCharacterId");

CREATE INDEX "scene_effect_instances_sceneId_kind_idx"
  ON "scene_effect_instances"("sceneId", "kind");
