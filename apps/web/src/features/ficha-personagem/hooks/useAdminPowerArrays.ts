import { useState, useEffect } from 'react';
import { fetchAdminPowerArrays, deletePowerArray, promotePowerArrayToOfficial } from '@/services/powerArrays.service';
import type { AcervoResponse } from '@/services/types';
import { useAuth } from '@/context/useAuth';

export function useAdminPowerArrays() {
  const { user } = useAuth();
  const [powerArrays, setPowerArrays] = useState<AcervoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPowerArrays();
    } else {
      setPowerArrays([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchPowerArrays = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminPowerArrays();
      setPowerArrays(data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError('Acesso negado. Você não tem privilégios de Administrador para ver esta página.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar acervos da biblioteca');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removePowerArray = async (id: string) => {
    try {
      setError(null);
      await deletePowerArray(id);
      setPowerArrays((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar acervo');
      throw err;
    }
  };

  const promotePowerArray = async (id: string) => {
    try {
      setError(null);
      const updated = await promotePowerArrayToOfficial(id);
      setPowerArrays((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao oficializar acervo');
      throw err;
    }
  };

  return {
    powerArrays,
    isLoading,
    error,
    fetchPowerArrays,
    deletePowerArray: removePowerArray,
    promotePowerArray,
  };
}
