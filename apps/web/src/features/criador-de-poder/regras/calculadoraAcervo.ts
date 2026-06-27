import type { Acervo } from '../types/acervo.types';
import { calcularDetalhesPoder } from './calculadoraCusto';
import type { Efeito, Modificacao } from '../../../data';

interface DetalhesAcervoCalculado {
  custoPdaTotal: number;
  espacosTotal: number;
}

/**
 * Calcula os custos de um Acervo (PdA e Espaços)
 * Regras:
 * - PdA: Custo do poder mais caro + 1 PdA para cada poder adicional
 * - Espaços: Soma dos espaços de todos os poderes do acervo
 */
export function calcularDetalhesAcervo(
  acervo: Acervo,
  efeitosCatalogo: Efeito[],
  modificacoesCatalogo: Modificacao[]
): DetalhesAcervoCalculado {
  if (!acervo.poderes || acervo.poderes.length === 0) {
    return { custoPdaTotal: 0, espacosTotal: 0 };
  }

  let custoPdAPrincipal = 0;
  let espacosTotal = 0;

  acervo.poderes.forEach((poder) => {
    const detalhes = calcularDetalhesPoder(poder, efeitosCatalogo, modificacoesCatalogo);
    
    // Atualiza poder principal se este for mais caro
    if (detalhes.custoPdATotal > custoPdAPrincipal) {
      custoPdAPrincipal = detalhes.custoPdATotal;
    }

    // Soma espaços de todos os poderes
    espacosTotal += detalhes.espacosTotal;
  });

  const custoPdAOutros = Math.max(0, acervo.poderes.length - 1) * 1;
  const custoPdaTotal = custoPdAPrincipal + custoPdAOutros;

  return {
    custoPdaTotal,
    espacosTotal,
  };
}
