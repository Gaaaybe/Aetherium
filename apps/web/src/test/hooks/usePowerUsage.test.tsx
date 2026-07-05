import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePowerUsage, describeMutations } from '@/features/ficha-personagem/hooks/usePowerUsage';
import { resolvePower } from '@/services/powers.service';

vi.mock('@/services/powers.service', () => ({
  resolvePower: vi.fn(),
}));

vi.mock('@/shared/ui', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('describeMutations', () => {
  test('deve descrever corretamente as mutações suportadas', () => {
    expect(describeMutations([{ type: 'DEAL_DAMAGE', formula: '2d6', damageType: 'fogo' }])).toEqual([
      '💥 Causa 2d6 de dano (fogo)',
    ]);
    expect(describeMutations([{ type: 'DEAL_DAMAGE', formula: '1d4', isSelfInflicted: true }])).toEqual([
      '💥 Causa 1d4 de dano (físico) em você mesmo',
    ]);
    expect(describeMutations([{ type: 'HEAL', formula: '10' }])).toEqual([
      '💚 Cura 10 PV',
    ]);
    expect(describeMutations([{ type: 'RESTORE_PE', formula: '5' }])).toEqual([
      '⚡ Restaura 5 PE',
    ]);
    expect(describeMutations([{ type: 'ADD_TEMP_PV', formula: '1d128' }])).toEqual([
      '🛡️ Concede 1d128 PV temporários',
    ]);
    expect(describeMutations([{ type: 'ADD_TEMP_PE', formula: '12' }])).toEqual([
      '⚡ Concede 12 PE temporários',
    ]);
    expect(describeMutations([{ type: 'APPLY_CONDITION', condicaoId: 'Abalado' }])).toEqual([
      '🌀 Aplica condição: Abalado',
    ]);
    expect(describeMutations([{ type: 'APPLY_MARKER', markerId: 'm-1', label: 'Marca' }])).toEqual([
      '🏷️ Marca alvo: Marca',
    ]);
    expect(describeMutations([{ type: 'REGISTER_TRIGGER', trigger: { evento: 'DANO_RECEBIDO' } }])).toEqual([
      '⚙️ Registra gatilho: DANO_RECEBIDO',
    ]);
    expect(describeMutations([{ type: 'UNKNOWN_TYPE' as any }])).toEqual([
      '🎲 Efeito: UNKNOWN_TYPE',
    ]);
  });
});

describe('usePowerUsage hook', () => {
  const characterId = 'test-char-id';
  const onSyncMock = vi.fn().mockResolvedValue(undefined);

  const mockCharacter = {
    id: 'test-char-id',
    level: 5,
    attributes: {
      keyPhysical: 'forca',
      keyMental: 'vontade',
      forca: { rollModifier: 3 },
      vontade: { rollModifier: 4 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('should load empty active powers initially', () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));
    expect(result.current.activePowers).toEqual([]);
  });

  test('should preview power resolving attribute modifiers', async () => {
    vi.mocked(resolvePower).mockResolvedValueOnce({ effects: [] } as any);

    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-1',
      nome: 'Teste',
      duracao: 1,
      peCost: 2,
    };

    let res;
    await act(async () => {
      res = await result.current.previewPower(power, mockCharacter as any);
    });

    expect(resolvePower).toHaveBeenCalledWith('power-1', {
      sceneId: `free-use-${characterId}`,
      candidateTargetIds: [],
      casterState: {
        id: characterId,
        keyPhysicalModifier: 3,
        keyMentalModifier: 4,
        level: 5,
      },
    });
    expect(res).toEqual({ resolution: { effects: [] }, peCost: 2 });
  });

  test('deve tratar erro no previewPower exibindo toast.error', async () => {
    vi.mocked(resolvePower).mockRejectedValueOnce(new Error('Falha na API'));

    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-1',
      nome: 'Teste',
      duracao: 1,
      peCost: 2,
    };

    let res;
    await act(async () => {
      res = await result.current.previewPower(power, mockCharacter as any);
    });

    expect(res).toBeNull();
    const { toast } = await import('@/shared/ui');
    expect(toast.error).toHaveBeenCalledWith('Erro ao resolver poder');
  });

  test('deve ativar poder instantâneo (duracao 0) se contiver o efeito fortalecer', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-instant-fort',
      nome: 'Fortalecer Ataque',
      duracao: 0,
      peCost: 1,
      efeitos: [{ efeitoBaseId: 'fortalecer' }],
    };

    await act(async () => {
      await result.current.confirmUsePower(power);
    });

    expect(result.current.activePowers).toHaveLength(1);
    expect(result.current.activePowers[0].powerId).toBe('power-instant-fort');
  });

  test('deve ativar poder com duracao 3 (Ativado) e nao ativar com duracao 4 (Permanente)', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    // Ativado (3)
    const powerAtivado = {
      powerId: 'power-ativado',
      nome: 'Escudo Ativado',
      duracao: 3,
      peCost: 2,
    };

    await act(async () => {
      await result.current.confirmUsePower(powerAtivado);
    });

    expect(result.current.activePowers).toHaveLength(1);
    expect(result.current.activePowers[0].powerId).toBe('power-ativado');

    // Permanente (4)
    const powerPermanente = {
      powerId: 'power-permanente',
      nome: 'Corpo de Aço',
      duracao: 4,
      peCost: 0,
    };

    await act(async () => {
      await result.current.confirmUsePower(powerPermanente);
    });

    // Deve continuar com tamanho 1 (só o ativado entrou)
    expect(result.current.activePowers).toHaveLength(1);
  });

  test('deve somar mutações e aplicar no onSync durante confirmUsePower apenas para o caster', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-healing',
      nome: 'Curar',
      duracao: 0,
      peCost: 4,
    };

    const mutations = [
      { type: 'HEAL', formula: '10', targetId: characterId },
      { type: 'RESTORE_PE', formula: '2', targetId: characterId },
      { type: 'ADD_TEMP_PV', formula: '5', targetId: characterId },
      { type: 'ADD_TEMP_PE', formula: '3', targetId: characterId },
      { type: 'HEAL', formula: '20', targetId: 'other-character-id' }, // outro alvo (deve ignorar)
    ];

    await act(async () => {
      await result.current.confirmUsePower(power, { mutations });
    });

    expect(onSyncMock).toHaveBeenCalledWith({
      pvChange: 10,
      peChange: -2, // 2 - 4 (peCost) = -2
      tempPvChange: 5,
      tempPeChange: 3,
    });
  });

  test('deve descontar custo de PE para manter poder ativo com maintainPower', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-sustentado',
      nome: 'Poder Sustentado',
      duracao: 2,
      peCost: 4,
    };

    await act(async () => {
      await result.current.confirmUsePower(power);
    });

    expect(result.current.activePowers).toHaveLength(1);
    const activeId = result.current.activePowers[0].id;

    await act(async () => {
      await result.current.maintainPower(activeId);
    });

    expect(onSyncMock).toHaveBeenLastCalledWith({ peChange: -2 });
  });

  test('maintainPower com peCostPerRound igual a 0 deve ser no-op', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-ativado-no-cost',
      nome: 'Ativado Sem Custo Manutencao',
      duracao: 3, // Ativado tem peCostPerRound = 0
      peCost: 2,
    };

    await act(async () => {
      await result.current.confirmUsePower(power);
    });

    expect(result.current.activePowers).toHaveLength(1);
    const activeId = result.current.activePowers[0].id;

    await act(async () => {
      await result.current.maintainPower(activeId);
    });

    // Não deve ter chamado onSyncMock para manutenção
    expect(onSyncMock).toHaveBeenCalledTimes(1); // apenas na ativação
  });

  test('deve desativar um poder ativo com deactivatePower', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-1',
      nome: 'Poder de Teste',
      duracao: 3,
      peCost: 1,
    };

    await act(async () => {
      await result.current.confirmUsePower(power);
    });

    expect(result.current.activePowers).toHaveLength(1);
    const activeId = result.current.activePowers[0].id;

    act(() => {
      result.current.deactivatePower(activeId);
    });

    expect(result.current.activePowers).toHaveLength(0);
  });

  test('deve isolar activePowers no localStorage por characterId', async () => {
    const { result: hook1 } = renderHook(() => usePowerUsage({ characterId: 'char-1', onSync: onSyncMock }));
    const { result: hook2 } = renderHook(() => usePowerUsage({ characterId: 'char-2', onSync: onSyncMock }));

    const power = {
      powerId: 'power-sustentado',
      nome: 'Sustentado',
      duracao: 2,
      peCost: 4,
    };

    await act(async () => {
      await hook1.current.confirmUsePower(power);
    });

    expect(hook1.current.activePowers).toHaveLength(1);
    expect(hook2.current.activePowers).toHaveLength(0); // isolamento!
  });

  test('deve lidar com JSON corrompido no localStorage retornando array vazio', () => {
    localStorage.setItem('active-powers-corrupted-id', 'invalid-json{[');
    const { result } = renderHook(() => usePowerUsage({ characterId: 'corrupted-id', onSync: onSyncMock }));
    expect(result.current.activePowers).toEqual([]);
  });

  test('deve limpar todos os poderes ativos com clearAll', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-1',
      nome: 'Poder de Teste',
      duracao: 3,
      peCost: 1,
    };

    await act(async () => {
      await result.current.confirmUsePower(power);
      await result.current.confirmUsePower(power);
    });

    expect(result.current.activePowers).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.activePowers).toHaveLength(0);
  });
});
