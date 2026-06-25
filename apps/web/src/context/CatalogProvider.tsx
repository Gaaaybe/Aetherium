import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Efeito, Modificacao } from '@/data';
import efeitosJson from '@/data/efeitos.json';
import modificacoesJson from '@/data/modificacoes.json';
import { fetchEffects, fetchModifications } from '@/services/catalog.service';
import { CatalogContext } from './catalog-context';

const EFEITOS_FALLBACK = efeitosJson as Efeito[];
const MODIFICACOES_FALLBACK = modificacoesJson as Modificacao[];

/**
 * Provê efeitos e modificações do catálogo para toda a aplicação utilizando TanStack Query.
 *
 * Estratégia:
 *  - Semeado com o JSON local (render imediato, sem flash de loading)
 *  - Busca da API em background e substitui os dados
 *  - Em caso de falha na API, mantém os dados do JSON local como fallback
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { data: efeitos = EFEITOS_FALLBACK, isLoading: loadingEffects } = useQuery({
    queryKey: ['effects'],
    queryFn: fetchEffects,
    initialData: EFEITOS_FALLBACK,
    staleTime: 1000 * 60 * 60 * 24, // cache catalog for 24 hours
  });

  const { data: modificacoes = MODIFICACOES_FALLBACK, isLoading: loadingModifications } = useQuery({
    queryKey: ['modifications'],
    queryFn: fetchModifications,
    initialData: MODIFICACOES_FALLBACK,
    staleTime: 1000 * 60 * 60 * 24, // cache catalog for 24 hours
  });

  const loading = loadingEffects || loadingModifications;

  return (
    <CatalogContext.Provider value={{ efeitos, modificacoes, loading }}>
      {children}
    </CatalogContext.Provider>
  );
}
