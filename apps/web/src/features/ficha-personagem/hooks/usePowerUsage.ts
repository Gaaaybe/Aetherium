import { useState, useCallback } from 'react';
import { resolvePower, type ResolvePowerResponse, type GameMutation } from '@/services/powers.service';
import type { CharacterResponse } from '@/services/characters.types';
import { toast } from '@/shared/ui';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface ActivePower {
  id: string;
  powerId: string;
  nome: string;
  icone?: string | null;
  duracao: number;
  peCostPerRound: number;
  activatedAt: number;
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
    async (power: {
      powerId: string;
      nome: string;
      icone?: string | null;
      duracao: number;
      peCost: number;
    }) => {
      setIsConfirming(true);
      try {
        // Debita o custo de PE via onSync
        if (power.peCost > 0) {
          await onSync({
            peChange: -power.peCost,
          });
        }

        // Registra poder ativo se tiver duração (Concentração, Sustentado, Ativado)
        if (power.duracao >= 1 && power.duracao <= 3) {
          const entry: ActivePower = {
            id: `${power.powerId}-${Date.now()}`,
            powerId: power.powerId,
            nome: power.nome,
            icone: power.icone,
            duracao: power.duracao,
            // Manutenção: metade do custo por rodada (arredondado p/ baixo)
            peCostPerRound: power.duracao <= 2 ? Math.floor(power.peCost / 2) : 0,
            activatedAt: Date.now(),
          };
          updateActive(prev => [entry, ...prev.filter(p => p.powerId !== power.powerId)]);
        }

        if (power.peCost > 0) {
          toast.success(`${power.nome} usado! −${power.peCost} PE`);
        } else {
          toast.success(`${power.nome} ativado!`);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Erro ao usar poder';
        toast.error(msg);
        throw err;
      } finally {
        setIsConfirming(false);
      }
    },
    [onSync, updateActive],
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
      updateActive(prev => prev.filter(p => p.id !== activeId));
    },
    [updateActive],
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
