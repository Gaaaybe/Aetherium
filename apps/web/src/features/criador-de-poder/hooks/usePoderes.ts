import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyPowers,
  createPower,
  updatePower,
  deletePower,
  copyPublicPower,
} from '@/services/powers.service';
import type { PoderResponse, UpdatePoderPayload } from '@/services/types';

export function usePoderes() {
  const queryClient = useQueryClient();

  const { data: poderes = [], isLoading, error } = useQuery({
    queryKey: ['powers'],
    queryFn: () => fetchMyPowers(1),
  });

  const createMutation = useMutation({
    mutationFn: createPower,
    onSuccess: (novo) => {
      queryClient.setQueryData(['powers'], (old: PoderResponse[] = []) => [novo, ...old]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePoderPayload }) => updatePower(id, payload),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(['powers'], (old: PoderResponse[] = []) =>
        old.map((p) => (p.id === atualizado.id ? atualizado : p))
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePower,
    onSuccess: (_, id) => {
      queryClient.setQueryData(['powers'], (old: PoderResponse[] = []) =>
        old.filter((p) => p.id !== id)
      );
    },
  });

  const copyMutation = useMutation({
    mutationFn: copyPublicPower,
    onSuccess: (copia) => {
      queryClient.setQueryData(['powers'], (old: PoderResponse[] = []) => [copia, ...old]);
    },
  });

  return {
    poderes,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    carregar: async () => {
      await queryClient.invalidateQueries({ queryKey: ['powers'] });
    },
    criar: createMutation.mutateAsync,
    atualizar: (id: string, payload: UpdatePoderPayload) => updateMutation.mutateAsync({ id, payload }),
    deletar: deleteMutation.mutateAsync,
    copiar: copyMutation.mutateAsync,
  };
}
