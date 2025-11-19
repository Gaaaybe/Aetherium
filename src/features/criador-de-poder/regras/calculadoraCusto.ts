import { Efeito, Modificacao, TABELA_UNIVERSAL } from '../../../data';
import { calcularModificadorParametro } from './escalas';

/**
 * Representa uma Modificação aplicada (com seus parâmetros customizados)
 */
export interface ModificacaoAplicada {
  id: string;
  modificacaoBaseId: string;
  escopo: 'global' | 'local';
  parametros?: Record<string, any>;
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
  efeitos: EfeitoAplicado[];
  modificacoesGlobais: ModificacaoAplicada[];
  // Parâmetros do poder (aplicados a TODOS os efeitos)
  // NUNCA são undefined - sempre têm valores numéricos
  acao: number;
  alcance: number;
  duracao: number;
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
  let custoPorGrau = efeitoBase.custoBase;
  
  // Aplica modificador de custo da configuração selecionada (ex: Imunidade Patamar 2 = +2)
  if (efeito.configuracaoSelecionada && efeitoBase.configuracoes) {
    const configuracao = efeitoBase.configuracoes.opcoes.find(
      opt => opt.id === efeito.configuracaoSelecionada
    );
    if (configuracao) {
      custoPorGrau += configuracao.modificadorCusto;
    }
  }
  
  // Soma modificações GLOBAIS (do Poder inteiro)
  for (const modAplicada of modificacoesGlobais) {
    const modBase = todasModificacoes.find(m => m.id === modAplicada.modificacaoBaseId);
    if (modBase) {
      const grauMod = modAplicada.grauModificacao || 1;
      custoPorGrau += modBase.custoPorGrau * grauMod;
    }
  }
  
  // Soma modificações LOCAIS (só deste Efeito)
  for (const modAplicada of efeito.modificacoesLocais) {
    const modBase = todasModificacoes.find(m => m.id === modAplicada.modificacaoBaseId);
    if (modBase) {
      const grauMod = modAplicada.grauModificacao || 1;
      custoPorGrau += modBase.custoPorGrau * grauMod;
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
      custoFixo += modBase.custoFixo;
    }
  }
  
  // Soma custos fixos LOCAIS
  for (const modAplicada of efeito.modificacoesLocais) {
    const modBase = todasModificacoes.find(m => m.id === modAplicada.modificacaoBaseId);
    if (modBase) {
      custoFixo += modBase.custoFixo;
    }
  }
  
  return custoFixo;
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
  
  const custoTotal = (custoPorGrau * efeito.grau) + custoFixo;
  
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
 */
export function calcularPETotal(
  poder: Poder,
  todosEfeitos: Efeito[],
  tabelaUniversal: any[]
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
  
  return maiorPE + outrosEfeitos;
}

/**
 * Calcula os Espaços totais do Poder
 * Regra: Espaços do efeito mais caro + 1 para cada outro efeito
 */
export function calcularEspacosTotal(
  poder: Poder,
  todosEfeitos: Efeito[],
  tabelaUniversal: any[]
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
  
  return maiorEspacos + outrosEfeitos;
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
  const peTotal = calcularPETotal(poder, todosEfeitos, TABELA_UNIVERSAL);
  const espacosTotal = calcularEspacosTotal(poder, todosEfeitos, TABELA_UNIVERSAL);
  
  return {
    custoPdATotal,
    peTotal,
    espacosTotal,
    efeitosDetalhados,
  };
}
