import { useLocalStorage } from './useLocalStorage';

interface Favoritos {
  efeitos: string[];
  modificacoes: string[];
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useLocalStorage<Favoritos>('favoritos', {
    efeitos: [],
    modificacoes: [],
  });

  const toggleFavoritoEfeito = (efeitoId: string) => {
    setFavoritos(prev => ({
      ...prev,
      efeitos: prev.efeitos.includes(efeitoId)
        ? prev.efeitos.filter(id => id !== efeitoId)
        : [...prev.efeitos, efeitoId],
    }));
  };

  const toggleFavoritoModificacao = (modificacaoId: string) => {
    setFavoritos(prev => ({
      ...prev,
      modificacoes: prev.modificacoes.includes(modificacaoId)
        ? prev.modificacoes.filter(id => id !== modificacaoId)
        : [...prev.modificacoes, modificacaoId],
    }));
  };

  const isFavoritoEfeito = (efeitoId: string): boolean => {
    return favoritos.efeitos.includes(efeitoId);
  };

  const isFavoritoModificacao = (modificacaoId: string): boolean => {
    return favoritos.modificacoes.includes(modificacaoId);
  };

  return {
    favoritos,
    toggleFavoritoEfeito,
    toggleFavoritoModificacao,
    isFavoritoEfeito,
    isFavoritoModificacao,
  };
}
