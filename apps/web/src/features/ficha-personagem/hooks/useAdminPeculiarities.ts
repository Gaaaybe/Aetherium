import { useState, useEffect } from 'react';
import { fetchAdminPeculiarities, deletePeculiarity, promotePeculiarityToOfficial } from '@/services/peculiarities.service';
import type { PeculiaridadeResponse } from '@/services/types';
import { useAuth } from '@/context/useAuth';

export function useAdminPeculiarities() {
  const { user } = useAuth();
  const [peculiarities, setPeculiarities] = useState<PeculiaridadeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPeculiarities();
    } else {
      setPeculiarities([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchPeculiarities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminPeculiarities();
      setPeculiarities(data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError('Acesso negado. Você não tem privilégios de Administrador para ver esta página.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar peculiaridades da biblioteca');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removePeculiarity = async (id: string) => {
    try {
      setError(null);
      await deletePeculiarity(id);
      setPeculiarities((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar peculiaridade');
      throw err;
    }
  };

  const promotePeculiarity = async (id: string) => {
    try {
      setError(null);
      const updated = await promotePeculiarityToOfficial(id);
      setPeculiarities((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao oficializar peculiaridade');
      throw err;
    }
  };

  return {
    peculiarities,
    isLoading,
    error,
    fetchPeculiarities,
    deletePeculiarity: removePeculiarity,
    promotePeculiarity,
  };
}
