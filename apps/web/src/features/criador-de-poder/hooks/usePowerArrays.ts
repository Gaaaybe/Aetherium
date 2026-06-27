import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyPowerArrays,
  createPowerArray,
  updatePowerArray,
  deletePowerArray,
} from '@/services/powerArrays.service';
import type { AcervoResponse, UpdateAcervoPayload } from '@/services/types';

export function usePowerArrays() {
  const queryClient = useQueryClient();

  const { data: acervos = [], isLoading, error } = useQuery({
    queryKey: ['powerArrays'],
    queryFn: () => fetchMyPowerArrays(1),
  });

  const createMutation = useMutation({
    mutationFn: createPowerArray,
    onSuccess: (novo) => {
      queryClient.setQueryData(['powerArrays'], (old: AcervoResponse[] = []) => [novo, ...old]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAcervoPayload }) => updatePowerArray(id, payload),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(['powerArrays'], (old: AcervoResponse[] = []) =>
        old.map((a) => (a.id === atualizado.id ? atualizado : a))
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePowerArray,
    onSuccess: (_, id) => {
      queryClient.setQueryData(['powerArrays'], (old: AcervoResponse[] = []) =>
        old.filter((a) => a.id !== id)
      );
    },
  });

  return {
    acervos,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    carregar: async () => {
      await queryClient.invalidateQueries({ queryKey: ['powerArrays'] });
    },
    criar: createMutation.mutateAsync,
    atualizar: (id: string, payload: UpdateAcervoPayload) => updateMutation.mutateAsync({ id, payload }),
    deletar: deleteMutation.mutateAsync,
  };
}
