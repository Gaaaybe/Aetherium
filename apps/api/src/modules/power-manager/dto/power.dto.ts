import { z } from 'zod';
import {
  createPowerBodySchema,
  updatePowerBodySchema,
  createPowerArrayBodySchema,
  updatePowerArrayBodySchema,
  createPeculiarityBodySchema,
  updatePeculiarityBodySchema,
  appliedModificationSchema,
  appliedEffectSchema,
  custoAlternativoSchema,
  DomainSchema as dominioSchema,
} from '@aetherium/rules-engine';

export {
  createPowerBodySchema,
  updatePowerBodySchema,
  createPowerArrayBodySchema,
  updatePowerArrayBodySchema,
  createPeculiarityBodySchema,
  updatePeculiarityBodySchema,
  appliedModificationSchema,
  appliedEffectSchema,
  custoAlternativoSchema,
  dominioSchema,
};

export const DomainSchema = dominioSchema;

export type CreatePowerBodySchema = z.infer<typeof createPowerBodySchema>;
export type UpdatePowerBodySchema = z.infer<typeof updatePowerBodySchema>;
export type CreatePowerArrayBodySchema = z.infer<typeof createPowerArrayBodySchema>;
export type UpdatePowerArrayBodySchema = z.infer<typeof updatePowerArrayBodySchema>;
export type CreatePeculiarityBodySchema = z.infer<typeof createPeculiarityBodySchema>;
export type UpdatePeculiarityBodySchema = z.infer<typeof updatePeculiarityBodySchema>;

function formatAppliedModification(mod: any) {
  return {
    modificationBaseId: mod.modificationBaseId,
    scope: mod.scope.toLowerCase(),
    grau: mod.grau,
    parametros: mod.parametros ?? null,
    nota: mod.nota ?? null,
  };
}

function formatAppliedEffect(effect: any) {
  return {
    id: effect.id,
    effectBaseId: effect.effectBaseId,
    grau: effect.grau,
    configuracaoId: effect.configuracaoId ?? null,
    inputValue: effect.inputValue ?? null,
    custo: {
      pda: effect.custoPda,
      pe: effect.custoPe,
      espacos: effect.custoEspacos,
    },
    modifications: effect.appliedModifications
      ? effect.appliedModifications
          .filter((am: any) => am.scope !== 'GLOBAL')
          .map(formatAppliedModification)
      : [],
    nota: effect.nota ?? null,
  };
}

export function formatPowerToHTTP(raw: any) {
  const alt = raw.custoAlternativoTipo
    ? {
        tipo: raw.custoAlternativoTipo.toLowerCase(),
        quantidade: raw.custoAlternativoQuantidade,
        descricao: raw.custoAlternativoDescricao ?? null,
        atributo: raw.custoAlternativoAtributo ?? null,
        itemId: raw.custoAlternativoItemId ?? null,
      }
    : null;

  const appliedEffects = raw.appliedEffects ? raw.appliedEffects : [];
  const globalModifications: any[] = [];
  if (raw.appliedEffects) {
    for (const ae of raw.appliedEffects) {
      if (ae.appliedModifications) {
        for (const am of ae.appliedModifications) {
          if (am.scope === 'GLOBAL') {
            globalModifications.push(am);
          }
        }
      }
    }
  }

  return {
    id: raw.id,
    userId: raw.userId ?? null,
    characterId: raw.characterId ?? null,
    nome: raw.nome,
    descricao: raw.descricao,
    isPublic: raw.isPublic,
    icone: raw.icone ?? null,
    notas: raw.notas ?? null,
    dominio: {
      name: raw.domainName.toLowerCase().replace(/_/g, '-'),
      areaConhecimento: raw.domainAreaConhecimento ?? null,
      peculiarId: raw.domainPeculiarId ?? null,
    },
    parametros: {
      acao: raw.parametrosAcao,
      alcance: raw.parametrosAlcance,
      duracao: raw.parametrosDuracao,
    },
    custoTotal: {
      pda: raw.custoTotalPda,
      pe: raw.custoTotalPe,
      espacos: raw.custoTotalEspacos,
    },
    custoAlternativo: alt,
    effects: appliedEffects.map(formatAppliedEffect),
    globalModifications: globalModifications.map(formatAppliedModification),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    userName: raw.user?.name ?? null,
  };
}

export function formatPowerArrayToHTTP(raw: any) {
  const pb =
    raw.parametrosBaseAcao !== null &&
    raw.parametrosBaseAlcance !== null &&
    raw.parametrosBaseDuracao !== null
      ? {
          acao: raw.parametrosBaseAcao,
          alcance: raw.parametrosBaseAlcance,
          duracao: raw.parametrosBaseDuracao,
        }
      : null;

  const powers = raw.powerArrayPowers ? raw.powerArrayPowers.map((pap: any) => pap.power) : [];

  return {
    id: raw.id,
    userId: raw.userId ?? null,
    characterId: raw.characterId ?? null,
    nome: raw.nome,
    descricao: raw.descricao,
    isPublic: raw.isPublic,
    icone: raw.icone ?? null,
    notas: raw.notas ?? null,
    dominio: {
      name: raw.domainName.toLowerCase().replace(/_/g, '-'),
      areaConhecimento: raw.domainAreaConhecimento ?? null,
      peculiarId: raw.domainPeculiarId ?? null,
    },
    parametrosBase: pb,
    custoTotal: {
      pda: raw.custoTotalPda,
      pe: raw.custoTotalPe,
      espacos: raw.custoTotalEspacos,
    },
    powers: powers.map(formatPowerToHTTP),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    userName: raw.user?.name ?? null,
  };
}

export function formatPeculiarityToHTTP(raw: any) {
  return {
    id: raw.id,
    userId: raw.userId,
    nome: raw.nome,
    descricao: raw.descricao,
    espiritual: raw.espiritual,
    isPublic: raw.isPublic,
    icone: raw.icone ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    userName: raw.user?.name ?? null,
  };
}

export function formatEffectBaseToHTTP(raw: any) {
  return {
    id: raw.id,
    nome: raw.nome,
    custoBase: raw.custoBase,
    descricao: raw.descricao,
    categorias: raw.categorias,
    exemplos: raw.exemplos ?? null,
    parametrosPadrao: {
      acao: raw.parametrosPadraoAcao,
      alcance: raw.parametrosPadraoAlcance,
      duracao: raw.parametrosPadraoDuracao,
    },
    requerInput: raw.requerInput,
    tipoInput: raw.tipoInput ?? null,
    labelInput: raw.labelInput ?? null,
    opcoesInput: raw.opcoesInput ?? [],
    placeholderInput: raw.placeholderInput ?? null,
    configuracoes: raw.configuracoes ?? null,
  };
}

export function formatModificationBaseToHTTP(raw: any) {
  return {
    id: raw.id,
    nome: raw.nome,
    tipo: raw.tipo.toLowerCase(),
    custoFixo: raw.custoFixo,
    custoPorGrau: raw.custoPorGrau,
    descricao: raw.descricao,
    categoria: raw.categoria,
    observacoes: raw.observacoes ?? null,
    detalhesGrau: raw.detalhesGrau ?? null,
    requerParametros: raw.requerParametros,
    tipoParametro: raw.tipoParametro ?? null,
    opcoes: raw.opcoes ?? [],
    grauMinimo: raw.grauMinimo ?? null,
    grauMaximo: raw.grauMaximo ?? null,
    placeholder: raw.placeholder ?? null,
    configuracoes: raw.configuracoes ?? null,
  };
}
