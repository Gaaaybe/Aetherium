import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminItems } from '@/features/ficha-personagem/hooks/useAdminItems';
import { fetchAdminItems, deleteItem, promoteItemToOfficial } from '@/services/items.service';

// Stable Mock Auth Context
const mockUser = { id: 'admin-123', isAdmin: true, name: 'Admin User' };
const mockAuth = { user: mockUser };
vi.mock('@/context/useAuth', () => ({
  useAuth: () => mockAuth,
}));

// Mock Items Service
vi.mock('@/services/items.service', () => ({
  fetchAdminItems: vi.fn(),
  deleteItem: vi.fn(),
  promoteItemToOfficial: vi.fn(),
}));

const mockItems = [
  {
    id: 'item-1',
    nome: 'Espada Lendária',
    descricao: 'Uma espada antiga',
    tipo: 'weapon',
    userId: 'user-456',
    precoVenda: 100,
    nivelItem: 3,
    valorBase: 50,
    custoBase: 10,
    powerIds: [],
    powerArrayIds: [],
    dominios: [],
    dominio: { name: 'combate', areaConhecimento: null, peculiarId: null },
    durabilidade: 'INTACTO',
    createdAt: '2026-07-13',
    updatedAt: null,
    userName: 'Player One',
  },
];

describe('useAdminItems hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deve buscar e listar os itens ao montar o hook', async () => {
    vi.mocked(fetchAdminItems).mockResolvedValueOnce(mockItems as any);

    const { result } = renderHook(() => useAdminItems());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.items).toEqual(mockItems);
    expect(fetchAdminItems).toHaveBeenCalledTimes(1);
  });

  test('deve definir mensagem de erro ao falhar na busca de itens', async () => {
    vi.mocked(fetchAdminItems).mockRejectedValueOnce({
      response: { status: 403 },
    });

    const { result } = renderHook(() => useAdminItems());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(
      'Acesso negado. Você não tem privilégios de Administrador para ver esta página.',
    );
  });

  test('deve remover um item da lista após a exclusão', async () => {
    vi.mocked(fetchAdminItems).mockResolvedValueOnce(mockItems as any);
    vi.mocked(deleteItem).mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useAdminItems());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.items.length).toBe(1);

    await act(async () => {
      await result.current.deleteItem('item-1');
    });

    expect(deleteItem).toHaveBeenCalledWith('item-1');
    expect(result.current.items.length).toBe(0);
  });

  test('deve atualizar o item promovido na lista', async () => {
    vi.mocked(fetchAdminItems).mockResolvedValueOnce(mockItems as any);
    
    const promotedItem = { ...mockItems[0], userId: null, userName: null };
    vi.mocked(promoteItemToOfficial).mockResolvedValueOnce(promotedItem as any);

    const { result } = renderHook(() => useAdminItems());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.promoteItem('item-1');
    });

    expect(promoteItemToOfficial).toHaveBeenCalledWith('item-1');
    expect(result.current.items[0].userId).toBeNull();
    expect(result.current.items[0].userName).toBeNull();
  });
});
