import { useState, useEffect, useCallback } from 'react';
import {
  fetchMyPeculiarities,
  createPeculiarity,
  updatePeculiarity,
  deletePeculiarity,
  fetchAdminPeculiarities,
} from '@/services/peculiarities.service';
import { useAuth } from '@/context/useAuth';
import type {
  CreatePeculiaridadePayload,
  PeculiaridadeResponse,
  UpdatePeculiaridadePayload,
} from '@/services/types';

interface UsePeculiaridadesState {
  peculiaridades: PeculiaridadeResponse[];
  loading: boolean;
  error: string | null;
}

export function usePeculiaridades() {
  const { user } = useAuth();
  const fetchAvailablePeculiarities = useCallback(async (page = 1) => {
    if (!user?.isAdmin) return fetchMyPeculiarities(page);
    const [owned, players] = await Promise.all([
      fetchMyPeculiarities(page),
      fetchAdminPeculiarities(),
    ]);
    return Array.from(new Map([...owned, ...players].map((peculiarity) => [peculiarity.id, peculiarity])).values());
  }, [user?.isAdmin]);
  const [state, setState] = useState<UsePeculiaridadesState>({
    peculiaridades: [],
    loading: true, // inicia como loading para evitar flash
    error: null,
  });

  // Carga inicial via promise chain (evita setState síncrono no corpo do efeito)
  useEffect(() => {
    let cancelled = false;
    fetchAvailablePeculiarities(1)
      .then((data) => {
        if (!cancelled) setState({ peculiaridades: data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar peculiaridades';
          setState({ peculiaridades: [], loading: false, error: msg });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchAvailablePeculiarities]);

  // Refresh manual
  const carregar = useCallback(async (page = 1) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchAvailablePeculiarities(page);
      setState({ peculiaridades: data, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar peculiaridades';
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }, [fetchAvailablePeculiarities]);

  const criar = useCallback(
    async (payload: CreatePeculiaridadePayload): Promise<PeculiaridadeResponse> => {
      const nova = await createPeculiarity(payload);
      setState((s) => ({ ...s, peculiaridades: [nova, ...s.peculiaridades] }));
      return nova;
    },
    [],
  );

  const atualizar = useCallback(
    async (id: string, payload: UpdatePeculiaridadePayload): Promise<PeculiaridadeResponse> => {
      const atualizada = await updatePeculiarity(id, payload);
      setState((s) => ({
        ...s,
        peculiaridades: s.peculiaridades.map((p) => (p.id === id ? atualizada : p)),
      }));
      return atualizada;
    },
    [],
  );

  const deletar = useCallback(async (id: string): Promise<void> => {
    await deletePeculiarity(id);
    setState((s) => ({ ...s, peculiaridades: s.peculiaridades.filter((p) => p.id !== id) }));
  }, []);

  return {
    peculiaridades: state.peculiaridades,
    loading: state.loading,
    error: state.error,
    carregar,
    criar,
    atualizar,
    deletar,
  };
}
