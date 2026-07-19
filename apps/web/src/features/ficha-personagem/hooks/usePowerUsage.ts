import { useState, useCallback, useEffect } from 'react';
import { resolvePower, applyMutations, type ResolvePowerResponse, type GameMutation } from '@/services/powers.service';
import type { CharacterResponse } from '@/services/characters.types';
import { toast } from '@/shared/ui';
import { calcPsychicStressGain, getPsychicPenalties, resolveGradativoStage } from '@aetherium/rules-engine';

// ─── Assistente de Rolagem de Dados Interno ──────────────────────────────────
function rollDiceFormula(formula: string): number {
  if (!formula) return 0;
  const cleaned = formula.replace(/\s+/g, '').toLowerCase();
  
  if (/^\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10);
  }
  
  const diceRegex = /(\+|-)?(\d+)?d(\d+)/g;
  let total = 0;
  let match;
  let hasDice = false;
  
  while ((match = diceRegex.exec(cleaned)) !== null) {
    hasDice = true;
    const sign = match[1] === '-' ? -1 : 1;
    const count = match[2] ? parseInt(match[2], 10) : 1;
    const faces = parseInt(match[3], 10);
    
    let diceSum = 0;
    for (let i = 0; i < count; i++) {
      diceSum += Math.floor(Math.random() * faces) + 1;
    }
    total += sign * diceSum;
  }
  
  const flatMatches = cleaned.match(/(\+|-)\d+(?!d)/g) || [];
  for (const flat of flatMatches) {
    total += parseInt(flat, 10);
  }
  
  const firstFlatMatch = cleaned.match(/^\d+(?!d)/);
  if (firstFlatMatch && !hasDice) {
    total += parseInt(firstFlatMatch[0], 10);
  }
  
  return total;
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface ActivePower {
  id: string;
  powerId: string;
  nome: string;
  icone?: string | null;
  duracao: number;
  peCostPerRound: number;
  activatedAt: number;
  efeitos?: any[];
  originItemId?: string;
  originItemTipo?: string;
}

export interface UsePowerResult {
  resolution: ResolvePowerResponse;
  peCost: number;
}

export interface GradativoProgress {
  global?: number;
  effects?: Record<string, number>;
}

interface UsePowerUsageOptions {
  characterId: string;
  onSync: (data: any) => Promise<void>;
}

// ─── Persistência local dos poderes ativos ────────────────────────────────────

const buildStorageKey = (characterId: string) => `active-powers-${characterId}`;
const buildGradativoStorageKey = (characterId: string) => `gradativo-progress-${characterId}`;

function loadActivePowers(characterId: string): ActivePower[] {
  try {
    const raw = localStorage.getItem(buildStorageKey(characterId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveActivePowers(characterId: string, powers: ActivePower[]): void {
  localStorage.setItem(buildStorageKey(characterId), JSON.stringify(powers));
}

function loadGradativoProgress(characterId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(buildGradativoStorageKey(characterId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGradativoProgress(characterId: string, progress: Record<string, number>): void {
  localStorage.setItem(buildGradativoStorageKey(characterId), JSON.stringify(progress));
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePowerUsage({ characterId, onSync }: UsePowerUsageOptions) {
  const [activePowers, setActivePowers] = useState<ActivePower[]>(() =>
    loadActivePowers(characterId),
  );
  const [isResolving, setIsResolving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [gradativoProgress, setGradativoProgress] = useState<Record<string, number>>(() =>
    loadGradativoProgress(characterId),
  );

  useEffect(() => {
    setActivePowers(loadActivePowers(characterId));
    setGradativoProgress(loadGradativoProgress(characterId));
  }, [characterId]);

  const updateGradativoProgress = useCallback(
    (key: string, value: number) => {
      setGradativoProgress((previous) => {
        const next = { ...previous, [key]: Math.max(1, Math.trunc(value)) };
        saveGradativoProgress(characterId, next);
        return next;
      });
      const separator = key.includes(':effect:') ? ':effect:' : ':global';
      const [powerId, effectId] = key.split(separator);
      setActivePowers((previous) => {
        const next = previous.map((activePower) => {
          if (activePower.powerId !== powerId || !activePower.efeitos) return activePower;
          return {
            ...activePower,
            efeitos: activePower.efeitos.map((effect: any) => {
              if (effectId && effect.id !== effectId) return effect;
              const maxDegree = effect.gradativoMaxDegree ?? effect.grau;
              const stage = resolveGradativoStage(maxDegree, value);
              return {
                ...effect,
                grau: stage.effectiveDegree,
                gradativoMaxDegree: maxDegree,
                gradativoExcessiveSteps: stage.excessiveSteps,
              };
            }),
          };
        });
        saveActivePowers(characterId, next);
        return next;
      });
    },
    [characterId],
  );

  const updateActive = useCallback(
    (updater: (prev: ActivePower[]) => ActivePower[]) => {
      setActivePowers(prev => {
        const next = updater(prev);
        saveActivePowers(characterId, next);
        return next;
      });
    },
    [characterId],
  );

  /**
   * Etapa 1: Resolve o poder no motor (sem aplicar).
   * Retorna as mutações para exibição no modal de confirmação.
   *
   * sceneId: identificador da cena atual. Convenção para cenas fora de combate formal:
   * usar `free-use-${characterId}` — o listener de eventos ignora cenas sem gatilhos ativos.
   */
  const previewPower = useCallback(
    async (
      power: {
        powerId: string;
        nome: string;
        icone?: string | null;
        duracao: number;
        acao?: number;
        peCost: number;
      },
      character: CharacterResponse,
      descargaMultiplier = 1,
      currentGradativoProgress?: GradativoProgress,
    ): Promise<UsePowerResult | null> => {
      setIsResolving(true);
      try {
        const keyPhysical = character.attributes.keyPhysical as string;
        const keyMental = character.attributes.keyMental as string;
        const physMod = ((character.attributes as any)[keyPhysical])?.rollModifier ?? 0;
        const mentalMod = ((character.attributes as any)[keyMental])?.rollModifier ?? 0;

        const resolution = await resolvePower(power.powerId, {
          sceneId: `free-use-${characterId}`,
          candidateTargetIds: [], // Sem alvo selecionado ainda — usado para powers sem alvo (buffs/gatilhos)
          descargaMultiplier,
          ...(currentGradativoProgress ? { gradativoProgress: currentGradativoProgress } : {}),
          casterState: {
            id: characterId,
            keyPhysicalModifier: physMod,
            keyMentalModifier: mentalMod,
            level: character.level,
          },
        });

        return { resolution, peCost: power.peCost };
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Erro ao resolver poder';
        toast.error(msg);
        return null;
      } finally {
        setIsResolving(false);
      }
    },

    [characterId],
  );

  /**
   * Etapa 2: Confirma e aplica o poder.
   * Debita PE via syncCharacter e registra o poder como ativo se tiver duração.
   * As mutações mecânicas (dano, cura, marcador) são aplicadas pelo backend quando
   * o endpoint /apply-mutations estiver disponível. Por ora, sincroniza só o PE.
   */
  const confirmUsePower = useCallback(
    async (
      power: {
        powerId: string;
        nome: string;
        icone?: string | null;
        duracao: number;
        acao?: number;
        peCost: number;
        efeitos?: any[];
        originItemId?: string;
        originItemTipo?: string;
        dominio?: { name: string; peculiarId?: string | null; espiritual?: boolean | null };
      },
      options?: { skipActivation?: boolean; mutations?: any[]; character?: CharacterResponse; descargaMultiplier?: number }
    ) => {
      setIsConfirming(true);
      try {
        let pvChange = 0;
        let peChange = 0;
        let tempPvChange = 0;
        let tempPeChange = 0;
        if (options?.mutations && Array.isArray(options.mutations)) {
          for (const mut of options.mutations) {
            const targetIsCaster = !mut.targetId || mut.targetId === characterId;
            if (targetIsCaster) {
              const formula = mut.formula || '0';
              const rolledVal = rollDiceFormula(formula);

              if (mut.type === 'ADD_TEMP_PV') {
                tempPvChange = Math.max(tempPvChange, rolledVal);
              } else if (mut.type === 'ADD_TEMP_PE') {
                tempPeChange = Math.max(tempPeChange, rolledVal);
              } else if (mut.type === 'HEAL') {
                pvChange += rolledVal;
              } else if (mut.type === 'RESTORE_PE') {
                peChange += rolledVal;
              }
            }
          }
        }

        // Calcule stress psíquico e penalidades antes do custo de PE
        const isPsychic = power.dominio?.name?.toLowerCase() === 'psíquico' || power.dominio?.name?.toLowerCase() === 'psiquico';
        let newStress = 0;
        let stressGain = 0;
        const stressDetails: string[] = [];
        let updatedNarrative: any = undefined;
        let conditionsToSync = options?.character?.conditions ? [...options.character.conditions] : undefined;

        if (isPsychic && options?.character) {
          const maxGrau = power.efeitos && Array.isArray(power.efeitos)
            ? power.efeitos.reduce((max, eff) => Math.max(max, eff.grau ?? 0), 0)
            : 0;

          const currentStress = options.character.narrative.psychicState?.stress ?? 0;
          stressGain = calcPsychicStressGain(maxGrau, options.character.level);
          newStress = currentStress + stressGain;

          const penalties = getPsychicPenalties(newStress, options.character.level);
          updatedNarrative = {
            psychicState: { stress: newStress }
          };

          if (penalties.esmorecido) {
            if (!conditionsToSync) conditionsToSync = [];
            if (!conditionsToSync.includes('Esmorecido')) {
              conditionsToSync.push('Esmorecido');
            }
          }

          if (penalties.danoPsiquico) {
            const pvMax = options.character.health.maxPV;
            const rolledDmg = Math.floor(Math.random() * pvMax) + 1;
            pvChange -= rolledDmg;
            stressDetails.push(`💥 ${rolledDmg} dano psíquico`);
          }

          if (penalties.perdaEnergia) {
            const peMax = options.character.energy.maxPE;
            const rolledLoss = Math.floor(Math.random() * peMax) + 1;
            peChange -= rolledLoss;
            stressDetails.push(`⚡ ${rolledLoss} PE perdido`);
          }
        }

        // Calcule o multiplicador correto de PE (Alquebrado e Custo Duplicado do estresse)
        let multiplier = 1;
        if (options?.character) {
          const hasAlquebrado = (options.character.conditions || []).some((c: string) => {
            const clean = c.includes('(') ? c.split('(')[0].trim() : c;
            return clean === 'Alquebrado';
          });
          if (hasAlquebrado) multiplier *= 2;

          if (isPsychic) {
            const stressToCheck = newStress > 0 ? newStress : (options.character.narrative.psychicState?.stress ?? 0);
            const stressExcess = stressToCheck - options.character.level;
            if (stressExcess >= 8) {
              multiplier *= 2;
            }
          }
        }

        const descargaMultiplier = power.duracao === 0 ? Math.max(1, options?.descargaMultiplier ?? 1) : 1;
        if (descargaMultiplier > 1) {
          multiplier *= descargaMultiplier;
        }

        const isFreePassive = power.duracao === 4 && power.acao === 5;
        const finalPeCost = isFreePassive ? 0 : power.peCost * multiplier;
        const finalPeChange = peChange - finalPeCost;

        if (
          pvChange !== 0 ||
          finalPeChange !== 0 ||
          tempPvChange !== 0 ||
          tempPeChange !== 0 ||
          updatedNarrative ||
          conditionsToSync
        ) {
          await onSync({
            pvChange: pvChange !== 0 ? pvChange : undefined,
            peChange: finalPeChange !== 0 ? finalPeChange : undefined,
            tempPvChange: tempPvChange !== 0 ? tempPvChange : undefined,
            tempPeChange: tempPeChange !== 0 ? tempPeChange : undefined,
            narrative: updatedNarrative,
            conditions: conditionsToSync,
          });
        }

        const thirdPartyMutations = (options?.mutations || []).filter(
          mut => mut.targetId && mut.targetId !== characterId
        );

        if (thirdPartyMutations.length > 0) {
          await applyMutations(`free-use-${characterId}`, characterId, thirdPartyMutations);
        }

        // Registra poder ativo se tiver duração (Concentração, Sustentado, Ativado)
        // OU se for Instantâneo (0) e contiver um efeito 'fortalecer' de atributo ou perícia
        const hasFortalecerEffect = power.efeitos?.some((ef: any) => {
          const baseId = ef.efeitoBaseId || ef.effectBaseId || ef.id;
          return baseId === 'fortalecer';
        });

        if (
          !options?.skipActivation &&
          ((power.duracao >= 1 && power.duracao <= 3) ||
            (power.duracao === 0 && hasFortalecerEffect))
        ) {
          const entry: ActivePower = {
            id: `${power.powerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            powerId: power.powerId,
            nome: power.nome,
            icone: power.icone,
            duracao: power.duracao,
            // Manutenção: metade do custo por rodada (arredondado p/ baixo)
            peCostPerRound: power.duracao <= 2 ? Math.floor(finalPeCost / 2) : 0,
            activatedAt: Date.now(),
            efeitos: power.efeitos,
            originItemId: power.originItemId,
            originItemTipo: (power as any).originItemTipo,
          };
          updateActive(prev => [entry, ...prev]);
        }

        let resultMsg = `${power.nome} usado!`;
        const details: string[] = [];
        if (finalPeCost > 0) details.push(`−${finalPeCost} PE`);
        if (pvChange > 0) details.push(`+${pvChange} PV`);
        if (pvChange < 0) details.push(`${pvChange} PV`);
        if (peChange > 0) details.push(`+${peChange} PE`);
        if (peChange < 0) details.push(`${peChange} PE`);
        if (tempPvChange > 0) details.push(`+${tempPvChange} PV Temp`);
        if (tempPeChange > 0) details.push(`+${tempPeChange} PE Temp`);
        if (stressGain > 0) details.push(`+${stressGain} Estresse Psíquico`);
        
        if (details.length > 0) {
          resultMsg += ` (${details.join(', ')})`;
        }
        toast.success(resultMsg);

        if (stressDetails.length > 0) {
          toast.warning(`Penalidades de Estresse: ${stressDetails.join(' e ')}`);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Erro ao usar poder';
        toast.error(msg);
        throw err;
      } finally {
        setIsConfirming(false);
      }
    },
    [characterId, onSync, updateActive],
  );

  /**
   * Manter poder ativo (Concentração/Sustentado) — drena PE por rodada.
   */
  const maintainPower = useCallback(
    async (activeId: string) => {
      const power = activePowers.find(p => p.id === activeId);
      if (!power || power.peCostPerRound <= 0) return;

      setIsConfirming(true);
      try {
        await onSync({
          peChange: -power.peCostPerRound,
        });
        toast.success(`${power.nome} mantido! −${power.peCostPerRound} PE`);
      } catch {
        toast.error('Erro ao manter poder');
      } finally {
        setIsConfirming(false);
      }
    },
    [activePowers, onSync],
  );


  const deactivatePower = useCallback(
    (activeId: string) => {
      const item = activePowers.find(p => p.id === activeId);
      if (item) {
        toast.success(`${item.nome} desativado!`);
      }
      updateActive(prev => prev.filter(p => p.id !== activeId));
    },
    [activePowers, updateActive],
  );

  const clearAll = useCallback(() => {
    updateActive(() => []);
  }, [updateActive]);

  return {
    activePowers,
    isResolving,
    isConfirming,
    previewPower,
    confirmUsePower,
    maintainPower,
    deactivatePower,
    clearAll,
    gradativoProgress,
    updateGradativoProgress,
  };
}

// ─── Helpers de display ───────────────────────────────────────────────────────

/** Transforma as mutações do motor em descrições legíveis para o modal. */
export function describeMutations(mutations: GameMutation[]): Array<{ text: string; type: string }> {
  return mutations.map(m => {
    switch (m.type) {
      case 'DEAL_DAMAGE':
        return {
          text: `Causa ${m.formula} de dano (${m.damageType ?? 'físico'})${m.isSelfInflicted ? ' em você mesmo' : ''}`,
          type: m.type
        };
      case 'HEAL':
        return {
          text: `Cura ${m.formula} PV`,
          type: m.type
        };
      case 'RESTORE_PE':
        return {
          text: `Restaura ${m.formula} PE`,
          type: m.type
        };
      case 'ADD_TEMP_PV':
        return {
          text: `Concede ${m.formula} PV temporários`,
          type: m.type
        };
      case 'ADD_TEMP_PE':
        return {
          text: `Concede ${m.formula} PE temporários`,
          type: m.type
        };
      case 'APPLY_CONDITION':
        return {
          text: `Aplica condição: ${m.condicaoId}`,
          type: m.type
        };
      case 'APPLY_MARKER':
        return {
          text: `Marca alvo: ${m.label ?? m.markerId}`,
          type: m.type
        };
      case 'REGISTER_TRIGGER':
        return {
          text: `Registra gatilho: ${m.trigger?.evento ?? ''}`,
          type: m.type
        };
      default:
        return {
          text: `Efeito: ${m.type}`,
          type: m.type
        };
    }
  });
}
