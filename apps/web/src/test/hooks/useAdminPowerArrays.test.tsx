import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminPowerArrays } from '@/features/ficha-personagem/hooks/useAdminPowerArrays';
import { fetchAdminPowerArrays, deletePowerArray, promotePowerArrayToOfficial } from '@/services/powerArrays.service';

// Stable Mock Auth Context
const mockUser = { id: 'admin-123', isAdmin: true, name: 'Admin User' };
const mockAuth = { user: mockUser };
vi.mock('@/context/useAuth', () => ({
  useAuth: () => mockAuth,
}));

// Mock Power Arrays Service
vi.mock('@/services/powerArrays.service', () => ({
  fetchAdminPowerArrays: vi.fn(),
  deletePowerArray: vi.fn(),
  promotePowerArrayToOfficial: vi.fn(),
}));

const mockPowerArrays = [
  {
    id: 'array-1',
    nome: 'Acervo Lendário',
    descricao: 'Uma coleção lendária',
    dominio: { name: 'combate', areaConhecimento: null, peculiarId: null },
    userId: 'user-456',
    isPublic: false,
    custoTotalPda: 4,
    custoTotalPe: 10,
    custoTotalEspacos: 2,
    powerArrayPowers: [],
    createdAt: '2026-07-13',
    updatedAt: null,
    userName: 'Player One',
  },
];

describe('useAdminPowerArrays hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deve buscar e listar os acervos ao montar o hook', async () => {
    vi.mocked(fetchAdminPowerArrays).mockResolvedValueOnce(mockPowerArrays as any);

    const { result } = renderHook(() => useAdminPowerArrays());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.powerArrays).toEqual(mockPowerArrays);
    expect(fetchAdminPowerArrays).toHaveBeenCalledTimes(1);
  });

  test('deve definir mensagem de erro ao falhar na busca de acervos', async () => {
    vi.mocked(fetchAdminPowerArrays).mockRejectedValueOnce({
      response: { status: 403 },
    });

    const { result } = renderHook(() => useAdminPowerArrays());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(
      'Acesso negado. Você não tem privilégios de Administrador para ver esta página.',
    );
  });

  test('deve remover um acervo da lista após a exclusão', async () => {
    vi.mocked(fetchAdminPowerArrays).mockResolvedValueOnce(mockPowerArrays as any);
    vi.mocked(deletePowerArray).mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useAdminPowerArrays());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.powerArrays.length).toBe(1);

    await act(async () => {
      await result.current.deletePowerArray('array-1');
    });

    expect(deletePowerArray).toHaveBeenCalledWith('array-1');
    expect(result.current.powerArrays.length).toBe(0);
  });

  test('deve atualizar o acervo promovido na lista', async () => {
    vi.mocked(fetchAdminPowerArrays).mockResolvedValueOnce(mockPowerArrays as any);
    
    const promotedArray = { ...mockPowerArrays[0], userId: null, userName: null, isPublic: true };
    vi.mocked(promotePowerArrayToOfficial).mockResolvedValueOnce(promotedArray as any);

    const { result } = renderHook(() => useAdminPowerArrays());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.promotePowerArray('array-1');
    });

    expect(promotePowerArrayToOfficial).toHaveBeenCalledWith('array-1');
    expect(result.current.powerArrays[0].userId).toBeNull();
    expect(result.current.powerArrays[0].isPublic).toBe(true);
  });
});
