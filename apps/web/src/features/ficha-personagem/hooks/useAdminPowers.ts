import { useState, useEffect } from 'react';
import { fetchAdminPowers, deletePower, promotePowerToOfficial } from '@/services/powers.service';
import type { PoderResponse } from '@/services/types';
import { useAuth } from '@/context/useAuth';

export function useAdminPowers() {
  const { user } = useAuth();
  const [powers, setPowers] = useState<PoderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPowers();
    } else {
      setPowers([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchPowers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminPowers();
      setPowers(data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError('Acesso negado. Você não tem privilégios de Administrador para ver esta página.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar poderes da biblioteca');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removePower = async (id: string) => {
    try {
      setError(null);
      await deletePower(id);
      setPowers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar poder');
      throw err;
    }
  };

  const promotePower = async (id: string) => {
    try {
      setError(null);
      const updated = await promotePowerToOfficial(id);
      setPowers((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao oficializar poder');
      throw err;
    }
  };

  return {
    powers,
    isLoading,
    error,
    fetchPowers,
    deletePower: removePower,
    promotePower,
  };
}
