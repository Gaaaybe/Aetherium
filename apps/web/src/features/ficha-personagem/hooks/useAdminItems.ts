import { useState, useEffect } from 'react';
import { fetchAdminItems, deleteItem, promoteItemToOfficial } from '@/services/items.service';
import type { ItemResponse } from '@/services/types';
import { useAuth } from '@/context/useAuth';

export function useAdminItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchItems();
    } else {
      setItems([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminItems();
      setItems(data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError('Acesso negado. Você não tem privilégios de Administrador para ver esta página.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar itens da biblioteca');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      setError(null);
      await deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar item');
      throw err;
    }
  };

  const promoteItem = async (id: string) => {
    try {
      setError(null);
      const updated = await promoteItemToOfficial(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao oficializar item');
      throw err;
    }
  };

  return {
    items,
    isLoading,
    error,
    fetchItems,
    deleteItem: removeItem,
    promoteItem,
  };
}
