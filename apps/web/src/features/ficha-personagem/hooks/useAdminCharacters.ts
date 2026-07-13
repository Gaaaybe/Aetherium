import { useState, useEffect } from 'react';
import { charactersService } from '@/services/characters.service';
import type { CharacterResponse } from '@/services/characters.types';
import { useAuth } from '@/context/useAuth';

export function useAdminCharacters() {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCharacters();
    } else {
      setCharacters([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchCharacters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await charactersService.fetchAdminCharacters();
      setCharacters(data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError('Acesso negado. Você não tem privilégios de Administrador para ver esta página.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar fichas de admin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCharacter = async (id: string) => {
    try {
      setError(null);
      await charactersService.deleteCharacter(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar personagem');
      throw err;
    }
  };

  return {
    characters,
    isLoading,
    error,
    fetchCharacters,
    deleteCharacter,
  };
}
