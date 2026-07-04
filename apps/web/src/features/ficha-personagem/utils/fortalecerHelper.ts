import {
  calcularBonusFortalecer,
  fortaleceAlvoMatch,
  calcularBonusCriticoMultiplicador,
  calcularBonusCriticoMargem,
  calcularBonusAlcanceItem,
  parseFortalecerCaracteristicaItem
} from '@aetherium/rules-engine';

export interface ActiveFortalecerBonus {
  atributos: Record<string, number>;
  pericias: Record<string, number>;
}

function obterModificadorAtributoPoder(power: any, character: any): number {
  if (!character || !character.attributes) return 0;
  
  // Se o activePower tiver domínio
  const dominioNome = power.dominio?.name || power.dominio?.peculiarId || '';
  const espiritualDomains = ['natural', 'sagrado', 'sacrilegio', 'psiquico'];
  
  const isEspiritual = espiritualDomains.includes(dominioNome.toLowerCase()) || 
                       (dominioNome.toLowerCase() === 'peculiar' && !!power.dominio?.espiritual);
                       
  const attrKey = isEspiritual ? character.attributes.keyMental : character.attributes.keyPhysical;
  const attr = character.attributes[attrKey];
  return attr?.rollModifier || 0;
}

export function obterBonusFortalecerAtivos(activePowers: any[], character?: any): ActiveFortalecerBonus {
  const result: ActiveFortalecerBonus = {
    atributos: {},
    pericias: {},
  };

  if (!activePowers || !Array.isArray(activePowers)) return result;

  // Track the highest bonus per powerId for each target
  const powerAtributoBonus: Record<string, Record<string, number>> = {};
  const powerPericiaBonus: Record<string, Record<string, number>> = {};

  for (const ap of activePowers) {
    const efeitos = ap.effects || ap.efeitos;
    if (!efeitos || !Array.isArray(efeitos)) continue;
    const powerId = ap.powerId || ap.id;

    if (!powerAtributoBonus[powerId]) powerAtributoBonus[powerId] = {};
    if (!powerPericiaBonus[powerId]) powerPericiaBonus[powerId] = {};

    for (const ef of efeitos) {
      const baseId = ef.efeitoBaseId || ef.effectBaseId;
      const inputValue = ef.inputCustomizado || ef.inputValue;
      if (baseId === 'fortalecer' && inputValue) {
        try {
          const alocacoes = JSON.parse(String(inputValue));
          if (Array.isArray(alocacoes)) {
            const mods = ef.modifications || ef.modificacoesLocais || [];
            const temBaseadoAtributos = mods.some((m: any) => (m.modificationBaseId || m.modificacaoBaseId) === 'baseado-atributos');
            const modAtributo = temBaseadoAtributos ? obterModificadorAtributoPoder(ap, character) : 0;

            for (const aloc of alocacoes) {
              if (aloc.tipo === 'atributo') {
                const atual = powerAtributoBonus[powerId][aloc.alvo] || 0;
                powerAtributoBonus[powerId][aloc.alvo] = Math.max(atual, aloc.bonus + modAtributo);
              } else if (aloc.tipo === 'pericia') {
                const atual = powerPericiaBonus[powerId][aloc.alvo] || 0;
                powerPericiaBonus[powerId][aloc.alvo] = Math.max(atual, aloc.bonus + modAtributo);
              }
            }
          }
        } catch (e) {
          // Ignore invalid JSON (compatibility with old text fields)
        }
      }
    }
  }

  // Sum max bonuses from different powerIds
  for (const powerId in powerAtributoBonus) {
    for (const alvo in powerAtributoBonus[powerId]) {
      result.atributos[alvo] = (result.atributos[alvo] || 0) + powerAtributoBonus[powerId][alvo];
    }
  }

  for (const powerId in powerPericiaBonus) {
    for (const alvo in powerPericiaBonus[powerId]) {
      result.pericias[alvo] = (result.pericias[alvo] || 0) + powerPericiaBonus[powerId][alvo];
    }
  }

  return result;
}

export function obterMaximoFormulaDados(formula: string): number {
  if (!formula) return 0;
  const cleaned = formula.replace(/\s+/g, '').toLowerCase();
  const diceRegex = /(\+|-)?(\d+)?d(\d+)/g;
  
  let max = 0;
  let match;
  
  while ((match = diceRegex.exec(cleaned)) !== null) {
    const sign = match[1] === '-' ? -1 : 1;
    const count = match[2] ? parseInt(match[2], 10) : 1;
    const faces = parseInt(match[3], 10);
    max += sign * (count * faces);
  }
  
  // Parse flat modifiers
  const flatMatches = cleaned.match(/(\+|-)\d+(?!d)/g) || [];
  for (const flat of flatMatches) {
    max += parseInt(flat, 10);
  }
  
  // If first number is flat and unsigned
  const firstFlatMatch = cleaned.match(/^\d+(?!d)/);
  if (firstFlatMatch) {
    max += parseInt(firstFlatMatch[0], 10);
  }
  
  return max;
}

import { buscarGrauNaTabela } from '@/data';

export function obterBonusVidaEnergiaFortalecer(activePowers: any[], character?: any): { maxPV: number; maxPE: number; tempPV: number; tempPE: number } {
  let bonusMaxPV = 0;
  let bonusMaxPE = 0;
  let bonusTempPV = 0;
  let bonusTempPE = 0;

  if (!activePowers || !Array.isArray(activePowers)) {
    return { maxPV: 0, maxPE: 0, tempPV: 0, tempPE: 0 };
  }

  const powerTempPVBonus: Record<string, number> = {};
  const powerTempPEBonus: Record<string, number> = {};

  for (const ap of activePowers) {
    const efeitos = ap.effects || ap.efeitos;
    if (!efeitos || !Array.isArray(efeitos)) continue;
    const powerId = ap.id || ap.powerId;

    for (const ef of efeitos) {
      const baseId = ef.efeitoBaseId || ef.effectBaseId;
      const configId = ef.configuracaoSelecionada || ef.configuracaoId;
      
      if (baseId === 'fortalecer') {
        const grau = ef.grau || 1;
        
        if (configId === 'pv') {
          const isRollExempt = ap.duracao === 4 || ap.duracao === 3 || ap.acao === 5;
          if (isRollExempt) {
            const tableItem = buscarGrauNaTabela(grau);
            const formula = tableItem?.dano || '';
            let maxVal = obterMaximoFormulaDados(formula);

            const mods = ef.modifications || ef.modificacoesLocais || [];
            const temBaseadoAtributos = mods.some((m: any) => (m.modificationBaseId || m.modificacaoBaseId) === 'baseado-atributos');
            if (temBaseadoAtributos) {
              maxVal += obterModificadorAtributoPoder(ap, character);
            }

            powerTempPVBonus[powerId] = Math.max(powerTempPVBonus[powerId] || 0, maxVal);
          }
        } else if (configId === 'pe') {
          // Fortalecer PE concede PE Temporário de forma fixa: 4 * Grau (independente de duração)
          const val = 4 * grau;
          powerTempPEBonus[powerId] = Math.max(powerTempPEBonus[powerId] || 0, val);
        }
      }
    }
  }

  for (const powerId in powerTempPVBonus) {
    bonusTempPV += powerTempPVBonus[powerId];
  }
  for (const powerId in powerTempPEBonus) {
    bonusTempPE += powerTempPEBonus[powerId];
  }

  return { maxPV: bonusMaxPV, maxPE: bonusMaxPE, tempPV: bonusTempPV, tempPE: bonusTempPE };
}

export interface FortalecerComponent {
  formula: string;
  descritor: string;
  grau: number;
  configId: string;
}

export function obterBonusFortalecerDanoRecuperacao(
  activePowers: any[],
  source: { 
    tipo: 'PODER' | 'ARMA' | 'DESARMADO'; 
    dominio?: string; 
    domains?: string[]; 
    itemId?: string; 
    originItemId?: string; 
  },
  character?: any
): FortalecerComponent[] {
  const result: FortalecerComponent[] = [];
  if (!activePowers || !Array.isArray(activePowers)) return result;

  for (const ap of activePowers) {
    const efeitos = ap.effects || ap.efeitos;
    if (!efeitos || !Array.isArray(efeitos)) continue;

    for (const ef of efeitos) {
      const baseId = ef.efeitoBaseId || ef.effectBaseId;
      const configId = ef.configuracaoSelecionada || ef.configuracaoId;

      if (baseId === 'fortalecer' && (configId === 'dano' || configId === 'recuperacao')) {
        const inputValue = ef.inputCustomizado || ef.inputValue;
        if (!inputValue) continue;

        try {
          const parsed = JSON.parse(String(inputValue));
          if (parsed && parsed.alvo) {
            const matched = fortaleceAlvoMatch(parsed.alvo, source, ap.originItemId);
            if (matched) {
              const grau = ef.grau || 1;
              let bonus = calcularBonusFortalecer(grau);

              const mods = ef.modifications || ef.modificacoesLocais || [];
              const temBaseadoAtributos = mods.some((m: any) => (m.modificationBaseId || m.modificacaoBaseId) === 'baseado-atributos');
              if (temBaseadoAtributos) {
                bonus += obterModificadorAtributoPoder(ap, character);
              }

              result.push({
                formula: `+${bonus}`,
                descritor: parsed.bonusDescritor || '',
                grau,
                configId
              });
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  return result;
}

export function obterBonusFortalecerRD(activePowers: any[], character?: any): number {
  let totalBonus = 0;
  if (!activePowers || !Array.isArray(activePowers)) return 0;

  const powerRDBonus: Record<string, number> = {};

  for (const ap of activePowers) {
    const efeitos = ap.effects || ap.efeitos;
    if (!efeitos || !Array.isArray(efeitos)) continue;
    const powerId = ap.id || ap.powerId;

    for (const ef of efeitos) {
      const baseId = ef.efeitoBaseId || ef.effectBaseId;
      const configId = ef.configuracaoSelecionada || ef.configuracaoId;

      if (baseId === 'fortalecer' && configId === 'rd') {
        const grau = ef.grau || 1;
        let bonus = 2 * Math.pow(2, grau - 1);

        const mods = ef.modifications || ef.modificacoesLocais || [];
        const temBaseadoAtributos = mods.some((m: any) => (m.modificationBaseId || m.modificacaoBaseId) === 'baseado-atributos');
        if (temBaseadoAtributos) {
          bonus += obterModificadorAtributoPoder(ap, character);
        }

        powerRDBonus[powerId] = Math.max(powerRDBonus[powerId] || 0, bonus);
      }
    }
  }

  for (const powerId in powerRDBonus) {
    totalBonus += powerRDBonus[powerId];
  }

  return totalBonus;
}

export function obterBonusFortalecerAcoes(activePowers: any[]): number {
  let totalBonus = 0;
  if (!activePowers || !Array.isArray(activePowers)) return 0;

  const powerAcoesBonus: Record<string, number> = {};

  for (const ap of activePowers) {
    const efeitos = ap.effects || ap.efeitos;
    if (!efeitos || !Array.isArray(efeitos)) continue;
    const powerId = ap.id || ap.powerId;

    for (const ef of efeitos) {
      const baseId = ef.efeitoBaseId || ef.effectBaseId;
      const configId = ef.configuracaoSelecionada || ef.configuracaoId;

      if (baseId === 'fortalecer' && configId === 'acoes') {
        const grau = ef.grau || 1;
        let bonus = 0;
        if (grau >= 10) bonus = 3;
        else if (grau >= 6) bonus = 2;
        else if (grau >= 2) bonus = 1;

        powerAcoesBonus[powerId] = Math.max(powerAcoesBonus[powerId] || 0, bonus);
      }
    }
  }

  for (const powerId in powerAcoesBonus) {
    totalBonus += powerAcoesBonus[powerId];
  }

  return totalBonus;
}

export interface FortalecerCaracteristicaItemBonus {
  critMultiplierBonus: number;
  critMarginBonus: number;
  alcanceBonus: number;
}

export function obterBonusFortalecerCaracteristicasItem(
  activePowers: any[],
  itemId: string | undefined
): FortalecerCaracteristicaItemBonus {
  const result: FortalecerCaracteristicaItemBonus = {
    critMultiplierBonus: 0,
    critMarginBonus: 0,
    alcanceBonus: 0,
  };

  if (!activePowers || !Array.isArray(activePowers)) return result;

  for (const ap of activePowers) {
    const efeitos = ap.effects || ap.efeitos;
    if (!efeitos || !Array.isArray(efeitos)) continue;

    for (const ef of efeitos) {
      const baseId = ef.efeitoBaseId || ef.effectBaseId;
      const configId = ef.configuracaoSelecionada || ef.configuracaoId;

      if (
        baseId === 'fortalecer' &&
        ['critico-multiplicador', 'critico-margem', 'alcance'].includes(configId)
      ) {
        const inputValue = ef.inputCustomizado || ef.inputValue;
        const parsed = parseFortalecerCaracteristicaItem(inputValue);

        if (parsed.alvo.tipo === 'ITEM') {
          const matched = ap.originItemId === itemId;
          if (matched && itemId) {
            const grau = ef.grau || 1;
            if (configId === 'critico-multiplicador') {
              result.critMultiplierBonus += calcularBonusCriticoMultiplicador(grau);
            } else if (configId === 'critico-margem') {
              result.critMarginBonus += calcularBonusCriticoMargem(grau);
            } else if (configId === 'alcance') {
              result.alcanceBonus += calcularBonusAlcanceItem(grau);
            }
          }
        }
      }
    }
  }

  return result;
}

export function obterBonusFortalecerCaracteristicasDesarmado(
  activePowers: any[]
): FortalecerCaracteristicaItemBonus {
  const result: FortalecerCaracteristicaItemBonus = {
    critMultiplierBonus: 0,
    critMarginBonus: 0,
    alcanceBonus: 0,
  };

  if (!activePowers || !Array.isArray(activePowers)) return result;

  for (const ap of activePowers) {
    const efeitos = ap.effects || ap.efeitos;
    if (!efeitos || !Array.isArray(efeitos)) continue;

    for (const ef of efeitos) {
      const baseId = ef.efeitoBaseId || ef.effectBaseId;
      const configId = ef.configuracaoSelecionada || ef.configuracaoId;

      if (
        baseId === 'fortalecer' &&
        ['critico-multiplicador', 'critico-margem', 'alcance'].includes(configId)
      ) {
        const inputValue = ef.inputCustomizado || ef.inputValue;
        const parsed = parseFortalecerCaracteristicaItem(inputValue);

        if (parsed.alvo.tipo === 'DESARMADO') {
          const grau = ef.grau || 1;
          if (configId === 'critico-multiplicador') {
            result.critMultiplierBonus += calcularBonusCriticoMultiplicador(grau);
          } else if (configId === 'critico-margem') {
            result.critMarginBonus += calcularBonusCriticoMargem(grau);
          } else if (configId === 'alcance') {
            result.alcanceBonus += calcularBonusAlcanceItem(grau);
          }
        }
      }
    }
  }

  return result;
}

