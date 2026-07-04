import { useState, useCallback, useEffect } from 'react';
import { resolvePower, type ResolvePowerResponse, type GameMutation } from '@/services/powers.service';
import type { CharacterResponse } from '@/services/characters.types';
import { toast } from '@/shared/ui';

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

interface UsePowerUsageOptions {
  characterId: string;
  onSync: (data: any) => Promise<void>;
}

// ─── Persistência local dos poderes ativos ────────────────────────────────────

const buildStorageKey = (characterId: string) => `active-powers-${characterId}`;

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

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePowerUsage({ characterId, onSync }: UsePowerUsageOptions) {
  const [activePowers, setActivePowers] = useState<ActivePower[]>(() =>
    loadActivePowers(characterId),
  );
  const [isResolving, setIsResolving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setActivePowers(loadActivePowers(characterId));
  }, [characterId]);

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
        peCost: number;
      },
      character: CharacterResponse,
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
        peCost: number;
        efeitos?: any[];
        originItemId?: string;
        originItemTipo?: string;
      },
      options?: { skipActivation?: boolean; mutations?: any[] }
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

        const finalPeChange = peChange - power.peCost;

        if (pvChange !== 0 || finalPeChange !== 0 || tempPvChange !== 0 || tempPeChange !== 0) {
          await onSync({
            pvChange: pvChange !== 0 ? pvChange : undefined,
            peChange: finalPeChange !== 0 ? finalPeChange : undefined,
            tempPvChange: tempPvChange !== 0 ? tempPvChange : undefined,
            tempPeChange: tempPeChange !== 0 ? tempPeChange : undefined,
          });
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
            peCostPerRound: power.duracao <= 2 ? Math.floor(power.peCost / 2) : 0,
            activatedAt: Date.now(),
            efeitos: power.efeitos,
            originItemId: power.originItemId,
            originItemTipo: (power as any).originItemTipo,
          };
          updateActive(prev => [entry, ...prev]);
        }

        let resultMsg = `${power.nome} usado!`;
        const details: string[] = [];
        if (power.peCost > 0) details.push(`−${power.peCost} PE`);
        if (pvChange > 0) details.push(`+${pvChange} PV`);
        if (peChange > 0) details.push(`+${peChange} PE`);
        if (tempPvChange > 0) details.push(`+${tempPvChange} PV Temp`);
        if (tempPeChange > 0) details.push(`+${tempPeChange} PE Temp`);
        
        if (details.length > 0) {
          resultMsg += ` (${details.join(', ')})`;
        }
        toast.success(resultMsg);
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
  };
}

// ─── Helpers de display ───────────────────────────────────────────────────────

/** Transforma as mutações do motor em descrições legíveis para o modal. */
export function describeMutations(mutations: GameMutation[]): string[] {
  return mutations.map(m => {
    switch (m.type) {
      case 'DEAL_DAMAGE':
        return `💥 Causa ${m.formula} de dano (${m.damageType ?? 'físico'})${m.isSelfInflicted ? ' em você mesmo' : ''}`;
      case 'HEAL':
        return `💚 Cura ${m.formula} PV`;
      case 'RESTORE_PE':
        return `⚡ Restaura ${m.formula} PE`;
      case 'ADD_TEMP_PV':
        return `🛡️ Concede ${m.formula} PV temporários`;
      case 'ADD_TEMP_PE':
        return `⚡ Concede ${m.formula} PE temporários`;
      case 'APPLY_CONDITION':
        return `🌀 Aplica condição: ${m.condicaoId}`;
      case 'APPLY_MARKER':
        return `🏷️ Marca alvo: ${m.label ?? m.markerId}`;
      case 'REGISTER_TRIGGER':
        return `⚙️ Registra gatilho: ${m.trigger?.evento ?? ''}`;
      default:
        return `🎲 Efeito: ${m.type}`;
    }
  });
}
