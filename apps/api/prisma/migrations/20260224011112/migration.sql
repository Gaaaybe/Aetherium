-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'MASTER');

-- CreateEnum
CREATE TYPE "DomainName" AS ENUM ('NATURAL', 'SAGRADO', 'SACRILEGIO', 'PSIQUICO', 'CIENTIFICO', 'PECULIAR', 'ARMA_BRANCA', 'ARMA_FOGO', 'ARMA_TENSAO', 'ARMA_EXPLOSIVA', 'ARMA_TECNOLOGICA');

-- CreateEnum
CREATE TYPE "ModificationScope" AS ENUM ('GLOBAL', 'LOCAL');

-- CreateEnum
CREATE TYPE "ModificationType" AS ENUM ('EXTRA', 'FALHA');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roles" "UserRole"[] DEFAULT ARRAY['PLAYER']::"UserRole"[],
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "peculiarities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "espiritual" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "peculiarities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "powers" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "custom" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "domainName" "DomainName" NOT NULL,
    "domainAreaConhecimento" TEXT,
    "domainPeculiarId" TEXT,
    "parametrosAcao" INTEGER NOT NULL DEFAULT 2,
    "parametrosAlcance" INTEGER NOT NULL DEFAULT 1,
    "parametrosDuracao" INTEGER NOT NULL DEFAULT 0,
    "custoTotalPda" INTEGER NOT NULL DEFAULT 0,
    "custoTotalPe" INTEGER NOT NULL DEFAULT 0,
    "custoTotalEspacos" INTEGER NOT NULL DEFAULT 0,
    "custoAlternativoTipo" TEXT,
    "custoAlternativoQuantidade" INTEGER,
    "custoAlternativoDescricao" TEXT,
    "custoAlternativoAtributo" TEXT,
    "custoAlternativoItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_arrays" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "notas" TEXT,
    "domainName" "DomainName" NOT NULL,
    "domainAreaConhecimento" TEXT,
    "domainPeculiarId" TEXT,
    "parametrosBaseAcao" INTEGER,
    "parametrosBaseAlcance" INTEGER,
    "parametrosBaseDuracao" INTEGER,
    "custoTotalPda" INTEGER NOT NULL DEFAULT 0,
    "custoTotalPe" INTEGER NOT NULL DEFAULT 0,
    "custoTotalEspacos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "power_arrays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_effects" (
    "id" TEXT NOT NULL,
    "powerId" TEXT NOT NULL,
    "effectBaseId" TEXT NOT NULL,
    "grau" INTEGER NOT NULL,
    "configuracaoId" TEXT,
    "inputValue" TEXT,
    "nota" TEXT,
    "posicao" INTEGER NOT NULL DEFAULT 0,
    "custoPda" INTEGER NOT NULL DEFAULT 0,
    "custoPe" INTEGER NOT NULL DEFAULT 0,
    "custoEspacos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "applied_effects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_modifications" (
    "id" TEXT NOT NULL,
    "appliedEffectId" TEXT NOT NULL,
    "modificationBaseId" TEXT NOT NULL,
    "scope" "ModificationScope" NOT NULL,
    "grau" INTEGER NOT NULL DEFAULT 1,
    "parametros" JSONB,
    "nota" TEXT,
    "posicao" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "applied_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_array_powers" (
    "id" TEXT NOT NULL,
    "powerArrayId" TEXT NOT NULL,
    "powerId" TEXT NOT NULL,
    "posicao" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "power_array_powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "effect_bases" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "custoBase" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "categorias" TEXT[],
    "exemplos" TEXT,
    "parametrosPadraoAcao" INTEGER NOT NULL DEFAULT 2,
    "parametrosPadraoAlcance" INTEGER NOT NULL DEFAULT 1,
    "parametrosPadraoDuracao" INTEGER NOT NULL DEFAULT 0,
    "requerInput" BOOLEAN NOT NULL DEFAULT false,
    "tipoInput" TEXT,
    "labelInput" TEXT,
    "opcoesInput" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "placeholderInput" TEXT,
    "configuracoes" JSONB,
    "custom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "effect_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modification_bases" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "ModificationType" NOT NULL,
    "custoFixo" INTEGER NOT NULL,
    "custoPorGrau" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "observacoes" TEXT,
    "detalhesGrau" TEXT,
    "requerParametros" BOOLEAN NOT NULL DEFAULT false,
    "tipoParametro" TEXT,
    "opcoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "grauMinimo" INTEGER,
    "grauMaximo" INTEGER,
    "placeholder" TEXT,
    "configuracoes" JSONB,
    "custom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "modification_bases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "peculiarities_userId_idx" ON "peculiarities"("userId");

-- CreateIndex
CREATE INDEX "powers_domainName_idx" ON "powers"("domainName");

-- CreateIndex
CREATE INDEX "powers_domainPeculiarId_idx" ON "powers"("domainPeculiarId");

-- CreateIndex
CREATE INDEX "powers_custom_idx" ON "powers"("custom");

-- CreateIndex
CREATE INDEX "power_arrays_domainName_idx" ON "power_arrays"("domainName");

-- CreateIndex
CREATE INDEX "power_arrays_domainPeculiarId_idx" ON "power_arrays"("domainPeculiarId");

-- CreateIndex
CREATE INDEX "applied_effects_powerId_idx" ON "applied_effects"("powerId");

-- CreateIndex
CREATE INDEX "applied_effects_effectBaseId_idx" ON "applied_effects"("effectBaseId");

-- CreateIndex
CREATE INDEX "applied_modifications_appliedEffectId_idx" ON "applied_modifications"("appliedEffectId");

-- CreateIndex
CREATE INDEX "applied_modifications_modificationBaseId_idx" ON "applied_modifications"("modificationBaseId");

-- CreateIndex
CREATE INDEX "applied_modifications_scope_idx" ON "applied_modifications"("scope");

-- CreateIndex
CREATE INDEX "power_array_powers_powerArrayId_idx" ON "power_array_powers"("powerArrayId");

-- CreateIndex
CREATE INDEX "power_array_powers_powerId_idx" ON "power_array_powers"("powerId");

-- CreateIndex
CREATE UNIQUE INDEX "power_array_powers_powerArrayId_powerId_key" ON "power_array_powers"("powerArrayId", "powerId");

-- CreateIndex
CREATE INDEX "effect_bases_custom_idx" ON "effect_bases"("custom");

-- CreateIndex
CREATE INDEX "modification_bases_tipo_idx" ON "modification_bases"("tipo");

-- CreateIndex
CREATE INDEX "modification_bases_categoria_idx" ON "modification_bases"("categoria");

-- CreateIndex
CREATE INDEX "modification_bases_custom_idx" ON "modification_bases"("custom");

-- AddForeignKey
ALTER TABLE "peculiarities" ADD CONSTRAINT "peculiarities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "powers" ADD CONSTRAINT "powers_domainPeculiarId_fkey" FOREIGN KEY ("domainPeculiarId") REFERENCES "peculiarities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_arrays" ADD CONSTRAINT "power_arrays_domainPeculiarId_fkey" FOREIGN KEY ("domainPeculiarId") REFERENCES "peculiarities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_effects" ADD CONSTRAINT "applied_effects_powerId_fkey" FOREIGN KEY ("powerId") REFERENCES "powers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_effects" ADD CONSTRAINT "applied_effects_effectBaseId_fkey" FOREIGN KEY ("effectBaseId") REFERENCES "effect_bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_modifications" ADD CONSTRAINT "applied_modifications_appliedEffectId_fkey" FOREIGN KEY ("appliedEffectId") REFERENCES "applied_effects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_modifications" ADD CONSTRAINT "applied_modifications_modificationBaseId_fkey" FOREIGN KEY ("modificationBaseId") REFERENCES "modification_bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_array_powers" ADD CONSTRAINT "power_array_powers_powerArrayId_fkey" FOREIGN KEY ("powerArrayId") REFERENCES "power_arrays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_array_powers" ADD CONSTRAINT "power_array_powers_powerId_fkey" FOREIGN KEY ("powerId") REFERENCES "powers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
