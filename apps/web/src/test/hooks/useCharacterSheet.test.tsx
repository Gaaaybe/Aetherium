import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterSheet } from '@/features/ficha-personagem/hooks/useCharacterSheet';
import { charactersService } from '@/services/characters.service';

// Mock do service com todos os métodos implementados como vi.fn()
vi.mock('@/services/characters.service', () => ({
  charactersService: {
    getCharacterById: vi.fn(),
    syncCharacter: vi.fn(),
    levelUp: vi.fn(),
    equipPower: vi.fn(),
    unequipPower: vi.fn(),
    removePower: vi.fn(),
    addRunics: vi.fn(),
    spendRunics: vi.fn(),
    discardDomainMastery: vi.fn(),
    acquireDomainMastery: vi.fn(),
    acquirePower: vi.fn(),
    acquirePowerArray: vi.fn(),
    equipPowerArray: vi.fn(),
    unequipPowerArray: vi.fn(),
    removePowerArray: vi.fn(),
    addItemToInventory: vi.fn(),
    changeItemQuantity: vi.fn(),
    removeFromInventory: vi.fn(),
    equipItem: vi.fn(),
    unequipItem: vi.fn(),
    upgradeItem: vi.fn(),
    acquireBenefit: vi.fn(),
    removeBenefit: vi.fn(),
    updateUnarmedMastery: vi.fn(),
    rest: vi.fn(),
  },
}));

// Mock do toast do UI
vi.mock('@/shared/ui', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCharacter = {
  id: 'char-123',
  name: 'Orion',
  level: 1,
  runics: 100,
};

describe('useCharacterSheet hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deve carregar o personagem inicialmente no hook mount', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);

    const { result } = renderHook(() => useCharacterSheet('char-123'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.character).toBeNull();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.character).toEqual(mockCharacter);
    expect(charactersService.getCharacterById).toHaveBeenCalledWith('char-123');
  });

  test('deve lidar com erro ao carregar o personagem', async () => {
    vi.mocked(charactersService.getCharacterById).mockRejectedValueOnce(new Error('Erro de API'));

    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.character).toBeNull();
    const { toast } = await import('@/shared/ui');
    expect(toast.error).toHaveBeenCalledWith('Erro ao carregar personagem');
  });

  test('deve atualizar o estado do personagem ao sincronizar dados', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const updatedCharacter = { ...mockCharacter, runics: 80 };
    vi.mocked(charactersService.syncCharacter).mockResolvedValueOnce(updatedCharacter as any);

    await act(async () => {
      await result.current.sync({ peChange: -5 });
    });

    expect(result.current.character).toEqual(updatedCharacter);
    expect(charactersService.syncCharacter).toHaveBeenCalledWith('char-123', { peChange: -5 });
  });

  test('deve equipar um poder diretamente sem requerer confirmação', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    vi.mocked(charactersService.equipPower).mockResolvedValueOnce({ ...mockCharacter } as any);

    await act(async () => {
      await result.current.equipPower('p-1');
    });

    expect(charactersService.equipPower).toHaveBeenCalledWith('char-123', 'p-1');
    const { toast } = await import('@/shared/ui');
    expect(toast.success).toHaveBeenCalledWith('Poder equipado!');
  });

  test('deve desequipar um poder diretamente', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    vi.mocked(charactersService.unequipPower).mockResolvedValueOnce({ ...mockCharacter } as any);

    await act(async () => {
      await result.current.unequipPower('p-1');
    });

    expect(charactersService.unequipPower).toHaveBeenCalledWith('char-123', 'p-1');
    const { toast } = await import('@/shared/ui');
    expect(toast.success).toHaveBeenCalledWith('Poder desequipado!');
  });

  test('deve gerenciar fluxo de confirmação pendente para subir de nível', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.pendingAction).toBeNull();

    act(() => {
      result.current.levelUp();
    });

    expect(result.current.pendingAction).not.toBeNull();
    expect(result.current.pendingAction?.title).toBe('Subir de Nível');

    const updatedCharacter = { ...mockCharacter, level: 2 };
    vi.mocked(charactersService.levelUp).mockResolvedValueOnce(updatedCharacter as any);

    await act(async () => {
      await result.current.pendingAction?.onConfirm();
    });

    expect(charactersService.levelUp).toHaveBeenCalledWith('char-123');
    expect(result.current.character).toEqual(updatedCharacter);

    act(() => {
      result.current.clearPendingAction();
    });
    expect(result.current.pendingAction).toBeNull();
  });

  test('deve gerenciar fluxo de confirmação pendente para remover poder', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.removePower('p-1');
    });

    expect(result.current.pendingAction?.title).toBe('Remover Poder');

    vi.mocked(charactersService.removePower).mockResolvedValueOnce({ ...mockCharacter } as any);

    await act(async () => {
      await result.current.pendingAction?.onConfirm();
    });

    expect(charactersService.removePower).toHaveBeenCalledWith('char-123', 'p-1');
  });

  test('deve gerenciar fluxo de descanso', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const updatedCharacter = { ...mockCharacter, runics: 120 };
    vi.mocked(charactersService.rest).mockResolvedValueOnce(updatedCharacter as any);

    const restPayload = { quality: 'NORMAL' as const, durationHours: 8 };
    await act(async () => {
      await result.current.rest(restPayload);
    });

    expect(charactersService.rest).toHaveBeenCalledWith('char-123', restPayload);
    expect(result.current.character).toEqual(updatedCharacter);
  });

  test('deve gerenciar aquisição de poderes e acervos', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    vi.mocked(charactersService.acquirePower).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.acquirePower('p-1');
    });
    expect(charactersService.acquirePower).toHaveBeenCalledWith('char-123', 'p-1');

    vi.mocked(charactersService.acquirePowerArray).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.acquirePowerArray('pa-1');
    });
    expect(charactersService.acquirePowerArray).toHaveBeenCalledWith('char-123', 'pa-1');

    const narrativeAcquisition = {
      isFreeAcquisition: true,
      acquisitionNote: 'Recompensa da campanha',
    };
    vi.mocked(charactersService.acquirePower).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.acquirePower('p-2', narrativeAcquisition);
    });
    expect(charactersService.acquirePower).toHaveBeenCalledWith(
      'char-123',
      'p-2',
      narrativeAcquisition,
    );

    vi.mocked(charactersService.acquirePowerArray).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.acquirePowerArray('pa-2', narrativeAcquisition);
    });
    expect(charactersService.acquirePowerArray).toHaveBeenCalledWith(
      'char-123',
      'pa-2',
      narrativeAcquisition,
    );
  });

  test('deve gerenciar operações de inventário: adicionar, alterar quant e equipar/desequipar', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Adicionar item
    vi.mocked(charactersService.addItemToInventory).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.addItemToInventory('item-1', 2);
    });
    expect(charactersService.addItemToInventory).toHaveBeenCalledWith('char-123', 'item-1', 2);

    // Alterar quantidade
    vi.mocked(charactersService.changeItemQuantity).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.changeItemQuantity('item-1', 5);
    });
    expect(charactersService.changeItemQuantity).toHaveBeenCalledWith('char-123', 'item-1', 5);

    // Equipar item
    vi.mocked(charactersService.equipItem).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.equipItem('item-1', 'suit', 1);
    });
    expect(charactersService.equipItem).toHaveBeenCalledWith('char-123', 'item-1', 'suit', 1);

    // Desequipar item
    vi.mocked(charactersService.unequipItem).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.unequipItem('item-1', 'suit', 1);
    });
    expect(charactersService.unequipItem).toHaveBeenCalledWith('char-123', 'item-1', 'suit', 1);
  });

  test('deve gerenciar recursos rúnicos: adicionar e gastar', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    vi.mocked(charactersService.addRunics).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.addRunics(50);
    });
    expect(charactersService.addRunics).toHaveBeenCalledWith('char-123', 50);

    vi.mocked(charactersService.spendRunics).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.spendRunics(20);
    });
    expect(charactersService.spendRunics).toHaveBeenCalledWith('char-123', 20);
  });

  test('deve gerenciar aprimoramento de item', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    vi.mocked(charactersService.upgradeItem).mockResolvedValueOnce(mockCharacter as any);
    await act(async () => {
      await result.current.upgradeItem('item-1', 'material-gold', 500);
    });
    expect(charactersService.upgradeItem).toHaveBeenCalledWith('char-123', 'item-1', 'material-gold', 500);
  });

  test('deve gerenciar fluxo de confirmação pendente para remover benefício', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.removeBenefit('ben-1');
    });

    expect(result.current.pendingAction?.title).toBe('Remover Benefício');

    vi.mocked(charactersService.removeBenefit).mockResolvedValueOnce(mockCharacter as any);

    await act(async () => {
      await result.current.pendingAction?.onConfirm();
    });

    expect(charactersService.removeBenefit).toHaveBeenCalledWith('char-123', 'ben-1');
  });

  test('deve gerenciar fluxo de cancelamento de ação pendente', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.levelUp();
    });

    expect(result.current.pendingAction).not.toBeNull();

    act(() => {
      result.current.clearPendingAction();
    });

    expect(result.current.pendingAction).toBeNull();
  });

  test('deve expor estado isSyncing durante chamadas assíncronas', async () => {
    vi.mocked(charactersService.getCharacterById).mockResolvedValueOnce(mockCharacter as any);
    const { result } = renderHook(() => useCharacterSheet('char-123'));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    let resolveSync: any;
    const syncPromise = new Promise((resolve) => {
      resolveSync = resolve;
    });

    vi.mocked(charactersService.syncCharacter).mockImplementationOnce(() => syncPromise as any);

    expect(result.current.isSyncing).toBe(false);

    let actPromise: Promise<void>;
    act(() => {
      actPromise = result.current.sync({ pvChange: -10 });
    });

    expect(result.current.isSyncing).toBe(true);

    await act(async () => {
      resolveSync(mockCharacter);
      await actPromise;
    });

    expect(result.current.isSyncing).toBe(false);
  });
});
