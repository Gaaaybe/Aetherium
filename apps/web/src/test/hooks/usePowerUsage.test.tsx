import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePowerUsage } from '@/features/ficha-personagem/hooks/usePowerUsage';

vi.mock('@/services/powers.service', () => ({
  resolvePower: vi.fn(),
}));

vi.mock('@/shared/ui', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePowerUsage hook', () => {
  const characterId = 'test-char-id';
  const onSyncMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('should load empty active powers initially', () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));
    expect(result.current.activePowers).toEqual([]);
  });

  test('should activate power and allow multiple activations of the same power', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-1',
      nome: 'Poder de Teste',
      icone: null,
      duracao: 3, // Ativado
      peCost: 2,
    };

    // First activation
    await act(async () => {
      await result.current.confirmUsePower(power);
    });

    expect(onSyncMock).toHaveBeenCalledWith({ peChange: -2 });
    expect(result.current.activePowers).toHaveLength(1);
    expect(result.current.activePowers[0].powerId).toBe('power-1');

    // Second activation of the same power
    await act(async () => {
      await result.current.confirmUsePower(power);
    });

    expect(result.current.activePowers).toHaveLength(2);
    expect(result.current.activePowers[0].powerId).toBe('power-1');
    expect(result.current.activePowers[1].powerId).toBe('power-1');
    expect(result.current.activePowers[0].id).not.toBe(result.current.activePowers[1].id);
  });

  test('should skip activation if skipActivation option is true', async () => {
    const { result } = renderHook(() => usePowerUsage({ characterId, onSync: onSyncMock }));

    const power = {
      powerId: 'power-1',
      nome: 'Poder de Teste',
      icone: null,
      duracao: 3,
      peCost: 2,
    };

    await act(async () => {
      await result.current.confirmUsePower(power, { skipActivation: true });
    });

    expect(onSyncMock).toHaveBeenCalledWith({ peChange: -2 });
    expect(result.current.activePowers).toHaveLength(0);
  });
});
