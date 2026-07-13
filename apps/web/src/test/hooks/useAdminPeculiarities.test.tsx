import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminPeculiarities } from '@/features/ficha-personagem/hooks/useAdminPeculiarities';
import { fetchAdminPeculiarities, deletePeculiarity, promotePeculiarityToOfficial } from '@/services/peculiarities.service';

// Stable Mock Auth Context
const mockUser = { id: 'admin-123', isAdmin: true, name: 'Admin User' };
const mockAuth = { user: mockUser };
vi.mock('@/context/useAuth', () => ({
  useAuth: () => mockAuth,
}));

// Mock Peculiarities Service
vi.mock('@/services/peculiarities.service', () => ({
  fetchAdminPeculiarities: vi.fn(),
  deletePeculiarity: vi.fn(),
  promotePeculiarityToOfficial: vi.fn(),
}));

const mockPeculiarities = [
  {
    id: 'pec-1',
    nome: 'Herança Dracônica',
    descricao: 'Sangue elemental de dragão',
    espiritual: false,
    icone: 'flame',
    userId: 'user-456',
    isPublic: false,
    createdAt: '2026-07-13',
    updatedAt: null,
    userName: 'Player One',
  },
];

describe('useAdminPeculiarities hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deve buscar e listar as peculiaridades ao montar o hook', async () => {
    vi.mocked(fetchAdminPeculiarities).mockResolvedValueOnce(mockPeculiarities as any);

    const { result } = renderHook(() => useAdminPeculiarities());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.peculiarities).toEqual(mockPeculiarities);
    expect(fetchAdminPeculiarities).toHaveBeenCalledTimes(1);
  });

  test('deve definir mensagem de erro ao falhar na busca de peculiaridades', async () => {
    vi.mocked(fetchAdminPeculiarities).mockRejectedValueOnce({
      response: { status: 403 },
    });

    const { result } = renderHook(() => useAdminPeculiarities());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(
      'Acesso negado. Você não tem privilégios de Administrador para ver esta página.',
    );
  });

  test('deve remover uma peculiaridade da lista após a exclusão', async () => {
    vi.mocked(fetchAdminPeculiarities).mockResolvedValueOnce(mockPeculiarities as any);
    vi.mocked(deletePeculiarity).mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useAdminPeculiarities());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.peculiarities.length).toBe(1);

    await act(async () => {
      await result.current.deletePeculiarity('pec-1');
    });

    expect(deletePeculiarity).toHaveBeenCalledWith('pec-1');
    expect(result.current.peculiarities.length).toBe(0);
  });

  test('deve atualizar a peculiaridade promovida na lista', async () => {
    vi.mocked(fetchAdminPeculiarities).mockResolvedValueOnce(mockPeculiarities as any);
    
    const promotedPec = { ...mockPeculiarities[0], userId: null, userName: null, isPublic: true };
    vi.mocked(promotePeculiarityToOfficial).mockResolvedValueOnce(promotedPec as any);

    const { result } = renderHook(() => useAdminPeculiarities());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.promotePeculiarity('pec-1');
    });

    expect(promotePeculiarityToOfficial).toHaveBeenCalledWith('pec-1');
    expect(result.current.peculiarities[0].userId).toBeNull();
    expect(result.current.peculiarities[0].isPublic).toBe(true);
  });
});
