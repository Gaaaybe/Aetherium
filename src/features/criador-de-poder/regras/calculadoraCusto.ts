import { Efeito, Modificacao, TABELA_UNIVERSAL } from '../../../data';
import { calcularModificadorParametro } from './escalas';

/**
 * Representa uma Modificação aplicada (com seus parâmetros customizados)
 */
export interface ModificacaoAplicada {
  id: string;
  modificacaoBaseId: string;
  escopo: 'global' | 'local';
  parametros?: Record<string, unknown>;
  grauModificacao?: number; // Grau da própria modificação (ex: Área grau 3)
  nota?: string;
}

/**
 * Representa um Efeito dentro de um Poder
 */
export interface EfeitoAplicado {
  id: string;
  efeitoBaseId: string;
  grau: number;
  modificacoesLocais: ModificacaoAplicada[];
  // Input customizado para efeitos que requerem especificação
  inputCustomizado?: string;
  // Configuração selecionada (para efeitos com patamares/variantes)
  configuracaoSelecionada?: string; // ID da ConfiguracaoEfeito escolhida
}

/**
 * Representa um Poder completo
 */
export interface Poder {
  id: string;
  nome: string;
  descricao?: string;
  dominioId: string; // ID do domínio do poder
  dominioAreaConhecimento?: string; // Para Científico: área de conhecimento
  dominioIdPeculiar?: string; // Para Peculiar: ID da peculiaridade criada
  efeitos: EfeitoAplicado[];
  modificacoesGlobais: ModificacaoAplicada[];
  // Parâmetros do poder (aplicados a TODOS os efeitos)
  // NUNCA são undefined - sempre têm valores numéricos
  acao: number;
  alcance: number;
  duracao: number;
  // Configuração de custo alternativo
  custoAlternativo?: {
    tipo: 'pe' | 'pv' | 'atributo' | 'item' | 'material'; // Tipo de custo
    usaEfeitoColateral?: boolean; // Se true, usa Efeito Colateral 2 (sem desconto)
    descricao?: string; // Descrição do custo (ex: "Sofre 1d6 de dano", "Perde 2 de Força")
    valorMaterial?: number; // Para tipo 'material', valor em R$ (base 1000R)
  };
}

/**
 * RN-03: Calcula o CustoPorGrau_Final de um efeito
 * 
 * CustoPorGrau_Final = CustoBase_Efeito 
 *                    + ModificadorCusto_Configuração (se houver)
 *                    + Σ(Modificações_Globais_PorGrau)
 *                    + Σ(Modificações_Locais_PorGrau)
 *                    + Modificadores de Parâmetros (GLOBAIS do Poder)
 */
export function calcularCustoPorGrau(
  efeitoBase: Efeito,
  efeito: EfeitoAplicado,
  modificacoesGlobais: ModificacaoAplicada[],
  todasModificacoes: Modificacao[],
  modificadorParametrosGlobal: number
): number {
  let custoPorGrau = efeitoBase.custoBase || 0;
  
  // Aplica modificador de custo da configuração selecionada (ex: Imunidade Patamar 2 = +2)
  if (efeito.configuracaoSelecionada && efeitoBase.configuracoes) {
    const configuracao = efeitoBase.configuracoes.opcoes.find(
      opt => opt.id === efeito.configuracaoSelecionada
    );
    if (configuracao) {
      // Se tem custo progressivo, calcula o modificador baseado no número de aumentos
      if (configuracao.custoProgressivo === 'dobrado') {
        // Determina qual "aumento" estamos (1-2 = 1º, 3-4 = 2º, 5-6 = 3º, etc)
        // O modificador dobra: 1º = +1, 2º = +2, 3º = +4, 4º = +8...
        const numeroAumento = Math.ceil(efeito.grau / 2);
        const modificadorProgressivo = Math.pow(2, numeroAumento - 1);
        custoPorGrau += configuracao.modificadorCusto + modificadorProgressivo;
      } else {
        // Custo normal (fixo)
        custoPorGrau += configuracao.modificadorCusto;
      }
    }
  }
  
  // Soma modificações GLOBAIS (do Poder inteiro)
  for (const modAplicada of modificacoesGlobais) {
    const modBase = todasModificacoes.find(m => m.id === modAplicada.modificacaoBaseId);
    if (modBase) {
      const grauMod = modAplicada.grauModificacao || 1;
      let custoPorGrauMod = modBase.custoPorGrau;
      
      // Aplica modificador de custo da configuração selecionada (ex: Efeito Colateral Menor = -1)
      if (modAplicada.parametros?.configuracaoSelecionada && modBase.configuracoes) {
        const configuracao = modBase.configuracoes.opcoes.find(
          opt => opt.id === modAplicada.parametros?.configuracaoSelecionada
        );
        if (configuracao) {
          custoPorGrauMod += configuracao.modificadorCusto || 0;
        }
      }
      
      custoPorGrau += custoPorGrauMod * grauMod;
    }
  }
  
  // Soma modificações LOCAIS (só deste Efeito)
  for (const modAplicada of efeito.modificacoesLocais) {
    const modBase = todasModificacoes.find(m => m.id === modAplicada.modificacaoBaseId);
    if (modBase) {
      const grauMod = modAplicada.grauModificacao || 1;
      let custoPorGrauMod = modBase.custoPorGrau;
      
      // Aplica modificador de custo da configuração selecionada (ex: Efeito Colateral Menor = -1)
      if (modAplicada.parametros?.configuracaoSelecionada && modBase.configuracoes) {
        const configuracao = modBase.configuracoes.opcoes.find(
          opt => opt.id === modAplicada.parametros?.configuracaoSelecionada
        );
        if (configuracao) {
          custoPorGrauMod += configuracao.modificadorCusto || 0;
        }
      }
      
      custoPorGrau += custoPorGrauMod * grauMod;
    }
  }
  
  // RN-06: Soma o modificador de parâmetros GLOBAL
  // Este modificador é calculado UMA VEZ para o poder inteiro
  // (parametrosPoder - parametrosPadrãoPoder) e aplicado a TODOS os efeitos
  custoPorGrau += modificadorParametrosGlobal;
  
  // RN-05: O custo por grau NUNCA pode ser menor que 1
  return Math.max(1, custoPorGrau);
}

/**
 * RN-04: Calcula o CustoFixo_Final de um efeito
 * 
 * CustoFixo_Final = Σ(Modificações_Globais_Fixas) 
 *                 + Σ(Modificações_Locais_Fixas)
 */
export function calcularCustoFixo(
  efeito: EfeitoAplicado,
  modificacoesGlobais: ModificacaoAplicada[],
  todasModificacoes: Modificacao[]
): number {
  let custoFixo = 0;
  
  // Soma custos fixos GLOBAIS
  for (const modAplicada of modificacoesGlobais) {
    const modBase = todasModificacoes.find(m => m.id === modAplicada.modificacaoBaseId);
    if (modBase) {
      let custoFixoMod = modBase.custoFixo;
      
      // Aplica modificadorCustoFixo da configuração selecionada (caso especial: Afeta Intangível)
      if (modAplicada.parametros?.configuracaoSelecionada && modBase.configuracoes) {
        const configuracao = modBase.configuracoes.opcoes.find(
          opt => opt.id === modAplicada.parametros?.configuracaoSelecionada
        );
        if (configuracao?.modificadorCustoFixo !== undefined) {
          custoFixoMod += configuracao.modificadorCustoFixo;
        }
      }
      
      custoFixo += custoFixoMod;
    }
  }
  
  // Soma custos fixos LOCAIS
  for (const modAplicada of efeito.modificacoesLocais) {
    const modBase = todasModificacoes.find(m => m.id === modAplicada.modificacaoBaseId);
    if (modBase) {
      let custoFixoMod = modBase.custoFixo;
      
      // Aplica modificadorCustoFixo da configuração selecionada (caso especial: Afeta Intangível)
      if (modAplicada.parametros?.configuracaoSelecionada && modBase.configuracoes) {
        const configuracao = modBase.configuracoes.opcoes.find(
          opt => opt.id === modAplicada.parametros?.configuracaoSelecionada
        );
        if (configuracao?.modificadorCustoFixo !== undefined) {
          custoFixoMod += configuracao.modificadorCustoFixo;
        }
      }
      
      custoFixo += custoFixoMod;
    }
  }
  
  return custoFixo;
}

/**
 * Calcula os piores parâmetros (mais restritivos) entre todos os efeitos
 * REGRA: "Pior" = MENOR valor (mais restritivo)
 */
export function calcularParametrosPadrao(
  efeitos: EfeitoAplicado[],
  todosEfeitos: Efeito[]
): {
  acao: number;
  alcance: number;
  duracao: number;
} {
  if (efeitos.length === 0) {
    return { acao: 0, alcance: 0, duracao: 0 };
  }

  const acoes = efeitos.map(ef => {
    const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.acao ?? 0;
  });
  
  const alcances = efeitos.map(ef => {
    const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.alcance ?? 0;
  });
  
  const duracoes = efeitos.map(ef => {
    const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.duracao ?? 0;
  });

  const acaoMin = Math.min(...acoes);
  const alcanceMin = Math.min(...alcances);
  const duracaoMin = Math.min(...duracoes);

  return {
    acao: acaoMin,
    alcance: alcanceMin,
    duracao: duracaoMin,
  };
}

/**
 * RN-02: Calcula o custo total de PdA de um Efeito
 * 
 * CustoEfeito = (CustoPorGrau_Final × Grau_Efeito) + CustoFixo_Final
 */
export function calcularCustoEfeito(
  efeitoBase: Efeito,
  efeito: EfeitoAplicado,
  modificacoesGlobais: ModificacaoAplicada[],
  todasModificacoes: Modificacao[],
  modificadorParametrosGlobal: number
): number {
  const custoPorGrau = calcularCustoPorGrau(
    efeitoBase,
    efeito,
    modificacoesGlobais,
    todasModificacoes,
    modificadorParametrosGlobal
  );
  
  const custoFixo = calcularCustoFixo(
    efeito,
    modificacoesGlobais,
    todasModificacoes
  );
  
  // Graus negativos sempre custam como grau 1
  const grauParaCalculo = efeito.grau < 1 ? 1 : efeito.grau;
  const custoTotal = (custoPorGrau * grauParaCalculo) + custoFixo;
  
  // RN-05: O custo final também não pode ser menor que 1
  return Math.max(1, custoTotal);
}

/**
 * Calcula os parâmetros padrão do poder (pior parâmetro entre todos os efeitos)
 */
function calcularParametrosPadraoPoder(
  efeitos: EfeitoAplicado[],
  todosEfeitos: Efeito[]
): { acao: number; alcance: number; duracao: number } {
  if (efeitos.length === 0) {
    return { acao: 0, alcance: 0, duracao: 0 };
  }

  const acoes = efeitos.map(ef => {
    const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.acao ?? 0;
  });
  
  const alcances = efeitos.map(ef => {
    const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.alcance ?? 0;
  });
  
  const duracoes = efeitos.map(ef => {
    const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.duracao ?? 0;
  });

  return {
    acao: Math.min(...acoes),
    alcance: Math.min(...alcances),
    duracao: Math.min(...duracoes),
  };
}

/**
 * RN-02: Calcula o custo total de PdA de um Poder inteiro
 * 
 * CustoPoder = Σ(CustoEfeito) de todos os Efeitos
 */
export function calcularCustoPoder(
  poder: Poder,
  todosEfeitos: Efeito[],
  todasModificacoes: Modificacao[]
): number {
  let custoTotal = 0;
  
  // Calcula os parâmetros padrão do poder (pior entre todos os efeitos)
  const parametrosPadraoPoder = calcularParametrosPadraoPoder(poder.efeitos, todosEfeitos);
  
  // Calcula o modificador GLOBAL de parâmetros (UMA VEZ para o poder inteiro)
  // Modificador = (parâmetros atuais do poder) - (parâmetros padrão do poder)
  // Usa função que considera custoEquivalente (ex: Permanente = Ativado)
  const modificadorParametrosGlobal = 
    calcularModificadorParametro(parametrosPadraoPoder.acao, poder.acao, 'acao') +
    calcularModificadorParametro(parametrosPadraoPoder.alcance, poder.alcance, 'alcance') +
    calcularModificadorParametro(parametrosPadraoPoder.duracao, poder.duracao, 'duracao');
  
  for (const efeito of poder.efeitos) {
    const efeitoBase = todosEfeitos.find(e => e.id === efeito.efeitoBaseId);
    if (!efeitoBase) continue;
    
    const custoEfeito = calcularCustoEfeito(
      efeitoBase,
      efeito,
      poder.modificacoesGlobais,
      todasModificacoes,
      modificadorParametrosGlobal
    );
    
    custoTotal += custoEfeito;
  }
  
  // RN-05: O custo total do Poder também não pode ser menor que 1
  return Math.max(1, custoTotal);
}

/**
 * Calcula o PE total do Poder
 * Regra: PE do efeito mais caro + 1 para cada outro efeito
 * NOVA REGRA: Extras não-fixos (custoPorGrau) aumentam o custo de PE
 */
export function calcularPETotal(
  poder: Poder,
  todosEfeitos: Efeito[],
  todasModificacoes: Modificacao[],
  tabelaUniversal: Array<{ grau: number; pe: number }>
): number {
  if (poder.efeitos.length === 0) return 0;
  
  // Mapear cada efeito para seu PE
  const pesEfeitos = poder.efeitos.map(efeito => {
    const efeitoBase = todosEfeitos.find(e => e.id === efeito.efeitoBaseId);
    if (!efeitoBase) return 0;
    
    // Buscar PE na tabela universal pelo grau
    const dadosGrau = tabelaUniversal.find(t => t.grau === efeito.grau);
    return dadosGrau?.pe || 0;
  });
  
  // PE mais alto
  const maiorPE = Math.max(...pesEfeitos);
  
  // Número de outros efeitos
  const outrosEfeitos = poder.efeitos.length - 1;
  
  let peTotal = maiorPE + outrosEfeitos;
  
  // Adicionar custo BASE de todos os extras (globais e locais) ao PE de ativação
  // (custo fixo + custo por grau, sem multiplicar pelo grau do efeito)
  // Exceto as modificações de custo especiais que apenas modificam o resultado final
  const modificacoesCustoEspeciais = [
    'custo-pe-dobrado',
    'custo-pe-total', 
    'custo-pe-reduzido',
    'custo-pe-minimo'
  ];
  
  // Extras globais
  const extrasGlobais = poder.modificacoesGlobais.filter(mod => {
    const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
    return modBase && modBase.tipo === 'extra' && !modificacoesCustoEspeciais.includes(mod.modificacaoBaseId);
  });
  
  for (const mod of extrasGlobais) {
    const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
    if (!modBase) continue;
    
    let custoFixoMod = modBase.custoFixo;
    let custoPorGrauMod = modBase.custoPorGrau;
    
    // Aplica modificador de custo da configuração
    if (mod.parametros?.configuracaoSelecionada && modBase.configuracoes) {
      const config = modBase.configuracoes.opcoes.find(
        opt => opt.id === mod.parametros?.configuracaoSelecionada
      );
      if (config) {
        if (config.modificadorCusto !== undefined) {
          custoPorGrauMod += config.modificadorCusto;
        }
        if (config.modificadorCustoFixo !== undefined) {
          custoFixoMod += config.modificadorCustoFixo;
        }
      }
    }
    
    // Adiciona custo fixo + custo por grau (sem multiplicar pelo grau do efeito)
    const custoBase = custoFixoMod + custoPorGrauMod;
    peTotal += Math.abs(custoBase);
  }
  
  // Extras locais de cada efeito
  for (const efeito of poder.efeitos) {
    const extrasLocais = efeito.modificacoesLocais.filter(mod => {
      const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
      return modBase && modBase.tipo === 'extra' && !modificacoesCustoEspeciais.includes(mod.modificacaoBaseId);
    });
    
    for (const mod of extrasLocais) {
      const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
      if (!modBase) continue;
      
      let custoFixoMod = modBase.custoFixo;
      let custoPorGrauMod = modBase.custoPorGrau;
      
      // Aplica modificador de custo da configuração
      if (mod.parametros?.configuracaoSelecionada && modBase.configuracoes) {
        const config = modBase.configuracoes.opcoes.find(
          opt => opt.id === mod.parametros?.configuracaoSelecionada
        );
        if (config) {
          if (config.modificadorCusto !== undefined) {
            custoPorGrauMod += config.modificadorCusto;
          }
          if (config.modificadorCustoFixo !== undefined) {
            custoFixoMod += config.modificadorCustoFixo;
          }
        }
      }
      
      // Adiciona custo fixo + custo por grau (sem multiplicar pelo grau do efeito)
      const custoBase = custoFixoMod + custoPorGrauMod;
      peTotal += Math.abs(custoBase);
    }
  }
  
  // Aplicar modificações de custo de PE
  const modPEDobrado = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-dobrado' && 
    mod.parametros?.opcao === 'PE Dobrado'
  );
  const modPETotal = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-total' && 
    mod.parametros?.opcao === 'Todos PE'
  );
  const modPEReduzido = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-reduzido' && 
    mod.parametros?.opcao === 'PE pela Metade'
  );
  const modPEMinimo = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-minimo' && 
    mod.parametros?.opcao === 'PE Mínimo (metade - 3/efeito)'
  );
  
  if (modPEDobrado) {
    peTotal *= 2;
  } else if (modPETotal) {
    // PE Total: soma todos os PEs individuais (sem desconto para efeitos adicionais)
    peTotal = pesEfeitos.reduce((acc, pe) => acc + pe, 0);
  } else if (modPEReduzido) {
    peTotal = Math.max(1, Math.ceil(peTotal / 2));
  } else if (modPEMinimo) {
    // PE Mínimo: metade dos PE - 3 por cada efeito no poder
    peTotal = Math.max(1, Math.floor(peTotal / 2) - (3 * poder.efeitos.length));
  }
  
  return peTotal;
}

/**
 * Calcula os Espaços totais do Poder
 * Regra: Espaços do efeito mais caro + 1 para cada outro efeito
 */
export function calcularEspacosTotal(
  poder: Poder,
  todosEfeitos: Efeito[],
  tabelaUniversal: Array<{ grau: number; espacos: number }>
): number {
  if (poder.efeitos.length === 0) return 0;
  
  // Mapear cada efeito para seus Espaços
  const espacosEfeitos = poder.efeitos.map(efeito => {
    const efeitoBase = todosEfeitos.find(e => e.id === efeito.efeitoBaseId);
    if (!efeitoBase) return 0;
    
    // Buscar Espaços na tabela universal pelo grau
    const dadosGrau = tabelaUniversal.find(t => t.grau === efeito.grau);
    return dadosGrau?.espacos || 0;
  });
  
  // Espaços mais alto
  const maiorEspacos = Math.max(...espacosEfeitos);
  
  // Número de outros efeitos
  const outrosEfeitos = poder.efeitos.length - 1;
  
  let espacosTotal = maiorEspacos + outrosEfeitos;
  
  // Aplicar modificações de custo de Espaços
  const modEspacosDobrado = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-dobrado' && 
    mod.parametros?.opcao === 'Espaços Dobrados'
  );
  const modEspacosTotal = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-total' && 
    mod.parametros?.opcao === 'Todos Espaços'
  );
  const modEspacosReduzido = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-reduzido' && 
    mod.parametros?.opcao === 'Espaços pela Metade'
  );
  const modEspacosMinimo = poder.modificacoesGlobais.find(mod => 
    mod.modificacaoBaseId === 'custo-pe-minimo' && 
    mod.parametros?.opcao === 'Espaços Fixos (3)'
  );
  
  if (modEspacosDobrado) {
    espacosTotal *= 2;
  } else if (modEspacosTotal) {
    // Espaços Total: soma todos os Espaços individuais
    espacosTotal = espacosEfeitos.reduce((acc, espacos) => acc + espacos, 0);
  } else if (modEspacosReduzido) {
    espacosTotal = Math.max(1, Math.ceil(espacosTotal / 2));
  } else if (modEspacosMinimo) {
    // Espaços Fixos: sempre 3
    espacosTotal = 3;
  }
  
  return espacosTotal;
}

/**
 * Calcula informações detalhadas de um Poder (para exibição na UI)
 */
export function calcularDetalhesPoder(
  poder: Poder,
  todosEfeitos: Efeito[],
  todasModificacoes: Modificacao[]
) {
  // Calcula os parâmetros padrão do poder (pior entre todos os efeitos)
  const parametrosPadraoPoder = calcularParametrosPadraoPoder(poder.efeitos, todosEfeitos);
  
  // Calcula o modificador GLOBAL de parâmetros (UMA VEZ para o poder inteiro)
  // Usa função que considera custoEquivalente (ex: Permanente = Ativado)
  const modificadorParametrosGlobal = 
    calcularModificadorParametro(parametrosPadraoPoder.acao, poder.acao, 'acao') +
    calcularModificadorParametro(parametrosPadraoPoder.alcance, poder.alcance, 'alcance') +
    calcularModificadorParametro(parametrosPadraoPoder.duracao, poder.duracao, 'duracao');
  
  const efeitosDetalhados = poder.efeitos.map(efeito => {
    const efeitoBase = todosEfeitos.find(e => e.id === efeito.efeitoBaseId);
    if (!efeitoBase) return null;
    
    const custoPorGrau = calcularCustoPorGrau(
      efeitoBase,
      efeito,
      poder.modificacoesGlobais,
      todasModificacoes,
      modificadorParametrosGlobal
    );
    
    const custoFixo = calcularCustoFixo(
      efeito,
      poder.modificacoesGlobais,
      todasModificacoes
    );
    
    const custoTotal = calcularCustoEfeito(
      efeitoBase,
      efeito,
      poder.modificacoesGlobais,
      todasModificacoes,
      modificadorParametrosGlobal
    );
    
    return {
      efeito,
      efeitoBase,
      custoPorGrau,
      custoFixo,
      custoTotal,
    };
  }).filter(Boolean);
  
  const custoPdATotal = calcularCustoPoder(poder, todosEfeitos, todasModificacoes);
  const peTotal = calcularPETotal(poder, todosEfeitos, todasModificacoes, TABELA_UNIVERSAL);
  const espacosTotal = calcularEspacosTotal(poder, todosEfeitos, TABELA_UNIVERSAL);
  
  return {
    custoPdATotal,
    peTotal,
    espacosTotal,
    efeitosDetalhados,
  };
}
