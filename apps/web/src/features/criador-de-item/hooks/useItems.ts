import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyItems,
  createItem,
  updateItem,
  deleteItem,
  copyPublicItem,
  exportItem,
  importItem,
} from '@/services/items.service';
import type { UpdateItemPayload, ItemType } from '@/services/types';

interface LoadItemsParams {
  page?: number;
  tipo?: ItemType;
}

export function useItems(params: LoadItemsParams = {}) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['items', params.tipo, params.page ?? 1],
    queryFn: () => fetchMyItems({ page: params.page ?? 1, tipo: params.tipo }),
  });

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) => updateItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const copyMutation = useMutation({
    mutationFn: copyPublicItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: importItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return {
    items,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    carregar: async (_newParams: LoadItemsParams = {}) => {
      await queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    criar: createMutation.mutateAsync,
    atualizar: (id: string, payload: UpdateItemPayload) => updateMutation.mutateAsync({ id, payload }),
    deletar: deleteMutation.mutateAsync,
    copiar: copyMutation.mutateAsync,
    exportar: exportItem,
    importar: importMutation.mutateAsync,
  };
}
