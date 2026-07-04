import { useMemo } from 'react';
import type { Acervo, DetalhesAcervo } from '../types/acervo.types';
import type { Poder } from '../regras/calculadoraCusto';
import type { DetalhesPoder } from '../types';

interface PoderComDetalhes {
  poder: Poder;
  detalhes: DetalhesPoder;
}

/**
 * Hook para calcular detalhes de um Acervo de Poderes
 * 
 * Regras:
 * - Custo: Poder mais caro + 1 PdA por cada outro
 * - Espaços: somados de todos
 * - Validações: sem permanentes, nenhum > principal
 */
export function useAcervoCalculator(
  acervo: Acervo,
  poderesComDetalhes: PoderComDetalhes[]
): DetalhesAcervo {
  const detalhes = useMemo(() => {
    const erros: string[] = [];
    
    // Sem poderes
    if (!acervo.poderes || acervo.poderes.length === 0) {
      return {
        poderPrincipal: null,
        poderPrincipalIndex: -1,
        custoPdAPrincipal: 0,
        custoPdAOutros: 0,
        custoPdATotal: 0,
        peTotal: 0,
        espacosTotal: 0,
        temPoderPermanente: false,
        temPoderMaisCaro: false,
        quantidadePoderes: 0,
        valido: false,
        erros: ['Acervo precisa ter pelo menos 2 poderes'],
      };
    }
    
    // Mínimo 2 poderes
    if (acervo.poderes.length < 2) {
      erros.push('Acervo precisa ter pelo menos 2 poderes');
    }
    
    // Encontrar poder principal (mais caro)
    let poderPrincipalIndex = 0;
    let custoPdAPrincipal = 0;
    
    poderesComDetalhes.forEach((item, index) => {
      if (item.detalhes.custoPdATotal > custoPdAPrincipal) {
        custoPdAPrincipal = item.detalhes.custoPdATotal;
        poderPrincipalIndex = index;
      }
    });
    
    const poderPrincipal = acervo.poderes[poderPrincipalIndex] || null;
    
    // Verificar poderes com duração permanente
    let temPoderPermanente = false;
    poderesComDetalhes.forEach(({ poder }) => {
      if (poder.duracao === 4) { // Permanente = valor 4
        temPoderPermanente = true;
        erros.push(`Poder "${poder.nome}" tem duração Permanente (não permitido em acervos)`);
      }
    });
    
    // Verificar se algum poder custa mais que o principal
    let temPoderMaisCaro = false;
    poderesComDetalhes.forEach(({ poder, detalhes }, index) => {
      if (index !== poderPrincipalIndex && detalhes.custoPdATotal > custoPdAPrincipal) {
        temPoderMaisCaro = true;
        erros.push(
          `Poder "${poder.nome}" (${detalhes.custoPdATotal} PdA) custa mais que o principal (${custoPdAPrincipal} PdA)`
        );
      }
    });
    
    // Calcular custos do acervo
    const custoPdAOutros = (acervo.poderes.length - 1) * 1; // 1 PdA por cada poder adicional
    const custoPdATotal = custoPdAPrincipal + custoPdAOutros;
    
    // Calcular PE (soma de todos)
    const peTotal = poderesComDetalhes.reduce(
      (sum, { detalhes }) => sum + (detalhes.peTotal || 0),
      0
    );
    
    // Calcular espaços (soma de todos)
    const espacosTotal = poderesComDetalhes.reduce(
      (sum, { detalhes }) => sum + detalhes.espacosTotal,
      0
    );
    
    // Validação final
    const valido = erros.length === 0 && acervo.poderes.length >= 2;
    
    return {
      poderPrincipal,
      poderPrincipalIndex,
      custoPdAPrincipal,
      custoPdAOutros,
      custoPdATotal,
      peTotal,
      espacosTotal,
      temPoderPermanente,
      temPoderMaisCaro,
      quantidadePoderes: acervo.poderes.length,
      valido,
      erros,
    };
  }, [acervo, poderesComDetalhes]);
  
  return detalhes;
}
