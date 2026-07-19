import { describe, it, expect } from 'vitest';
import {
  calcularCustoPorGrau,
  calcularCustoFixo,
  calcularParametrosPadrao,
  calcularCustoEfeito,
  calcularCustoPoder,
  calcularPETotal,
  calcularEspacosTotal,
  calcularDetalhesPoder,
  type Poder,
  type EfeitoAplicado
} from '../../features/criador-de-poder/regras/calculadoraCusto';
import { Efeito, Modificacao } from '../../data';

// Fixtures mockadas de efeitos
const mockEfeitoDano: Efeito = {
  id: 'dano',
  nome: 'Dano',
  custoBase: 2,
  descricao: 'Causa dano',
  parametrosPadrao: { acao: 1, alcance: 1, duracao: 0 },
  categorias: ['Ataque'],
  exemplos: 'Exemplo dano',
};

const mockEfeitoCura: Efeito = {
  id: 'cura',
  nome: 'Cura',
  custoBase: 1,
  descricao: 'Cura PV',
  parametrosPadrao: { acao: 1, alcance: 2, duracao: 0 },
  categorias: ['Cura'],
  exemplos: 'Exemplo cura',
  configuracoes: {
    tipo: 'select',
    label: 'Opções',
    opcoes: [
      { id: 'patamar-2', nome: 'Patamar 2', modificadorCusto: 2, grauMinimo: 1, descricao: 'Melhoria' },
      { id: 'progressivo', nome: 'Progressivo', modificadorCusto: 0, grauMinimo: 1, descricao: 'Custo Dobrado', custoProgressivo: 'dobrado' }
    ]
  }
};

// Fixtures mockadas de modificações
const mockModificacaoArea: Modificacao = {
  id: 'area',
  nome: 'Área',
  tipo: 'extra',
  custoFixo: 1,
  custoPorGrau: 0,
  descricao: 'Afeta área',
  requerParametros: false,
  categoria: 'Área',
  configuracoes: {
    tipo: 'select',
    label: 'Área',
    opcoes: [
      { id: 'afeta-intangivel', nome: 'Afeta Intangível', modificadorCusto: 0, modificadorCustoFixo: 2, descricao: 'Extra' }
    ]
  }
};

const mockModificacaoCustoPEDobrado: Modificacao = {
  id: 'custo-pe-dobrado',
  nome: 'Custo PE Dobrado',
  tipo: 'extra',
  custoFixo: 0,
  custoPorGrau: 0,
  descricao: 'Dobra PE',
  requerParametros: false,
  categoria: 'Custo',
};

const mockModificacaoCustoPEReduzido: Modificacao = {
  id: 'custo-pe-reduzido',
  nome: 'Custo PE Reduzido',
  tipo: 'extra',
  custoFixo: 0,
  custoPorGrau: 0,
  descricao: 'Metade do PE',
  requerParametros: false,
  categoria: 'Custo',
};

const todosEfeitosMock = [mockEfeitoDano, mockEfeitoCura];
const todasModificacoesMock = [
  mockModificacaoArea,
  mockModificacaoCustoPEDobrado,
  mockModificacaoCustoPEReduzido
];

// Helper para criar um poder mockado válido
function makeFakePoder(overrides = {}): Poder {
  return {
    id: 'p-1',
    nome: 'Poder Teste',
    dominioId: 'fogo',
    efeitos: [],
    modificacoesGlobais: [],
    acao: 1,
    alcance: 1,
    duracao: 0,
    ...overrides
  };
}

describe('Calculadora de Custo de Criador de Poder - calculadoraCusto.ts', () => {

  describe('calcularCustoPorGrau', () => {
    it('deve retornar o custo base correto sem modificadores', () => {
      const efAplicado: EfeitoAplicado = { id: 'ef-1', efeitoBaseId: 'dano', grau: 3, modificacoesLocais: [] };
      const custo = calcularCustoPorGrau(mockEfeitoDano, efAplicado, [], [], 0);
      expect(custo).toBe(2); // custoBase = 2
    });

    it('deve aplicar custo de configuração normal selecionada', () => {
      const efAplicado: EfeitoAplicado = {
        id: 'ef-1',
        efeitoBaseId: 'cura',
        grau: 3,
        configuracaoSelecionada: 'patamar-2',
        modificacoesLocais: []
      };
      const custo = calcularCustoPorGrau(mockEfeitoCura, efAplicado, [], [], 0);
      expect(custo).toBe(3); // base 1 + config 2 = 3
    });

    it('deve aplicar custo progressivo dobrado baseado no grau do efeito', () => {
      // grau 3 -> numeroAumento = Math.ceil(3/2) = 2. modificadorProgressivo = 2^(2-1) = 2.
      // custoPorGrau = base (1) + config modificadorCusto (0) + modificadorProgressivo (2) = 3
      const efAplicado: EfeitoAplicado = {
        id: 'ef-1',
        efeitoBaseId: 'cura',
        grau: 3,
        configuracaoSelecionada: 'progressivo',
        modificacoesLocais: []
      };
      const custo = calcularCustoPorGrau(mockEfeitoCura, efAplicado, [], [], 0);
      expect(custo).toBe(3);
    });

    it('deve somar o modificador global de parâmetros do poder', () => {
      const efAplicado: EfeitoAplicado = { id: 'ef-1', efeitoBaseId: 'dano', grau: 1, modificacoesLocais: [] };
      const custo = calcularCustoPorGrau(mockEfeitoDano, efAplicado, [], [], 2);
      expect(custo).toBe(4); // base 2 + globalParam 2 = 4
    });

    it('nunca deve retornar custo por grau menor que 1', () => {
      const efAplicado: EfeitoAplicado = { id: 'ef-1', efeitoBaseId: 'cura', grau: 1, modificacoesLocais: [] };
      const custo = calcularCustoPorGrau(mockEfeitoCura, efAplicado, [], [], -5);
      expect(custo).toBe(1); // 1 - 5 = -4, travado no mínimo 1
    });
  });

  describe('calcularCustoFixo', () => {
    it('deve somar custos fixos locais e globais das modificações', () => {
      const efAplicado: EfeitoAplicado = {
        id: 'ef-1',
        efeitoBaseId: 'dano',
        grau: 1,
        modificacoesLocais: [{ id: 'ma-1', modificacaoBaseId: 'area', escopo: 'local' }]
      };
      const custoFixo = calcularCustoFixo(efAplicado, [], todasModificacoesMock);
      expect(custoFixo).toBe(1); // Mod Área custoFixo = 1
    });

    it('deve aplicar modificador de custo fixo da configuração selecionada', () => {
      const efAplicado: EfeitoAplicado = {
        id: 'ef-1',
        efeitoBaseId: 'dano',
        grau: 1,
        modificacoesLocais: [{
          id: 'ma-1',
          modificacaoBaseId: 'area',
          escopo: 'local',
          parametros: { configuracaoSelecionada: 'afeta-intangivel' }
        }]
      };
      const custoFixo = calcularCustoFixo(efAplicado, [], todasModificacoesMock);
      expect(custoFixo).toBe(3); // base 1 + config modificadorFixo 2 = 3
    });
  });

  describe('calcularParametrosPadrao', () => {
    it('deve retornar os piores (menores) parâmetros padrão de múltiplos efeitos', () => {
      const efs: EfeitoAplicado[] = [
        { id: 'ef-1', efeitoBaseId: 'dano', grau: 1, modificacoesLocais: [] },
        { id: 'ef-2', efeitoBaseId: 'cura', grau: 1, modificacoesLocais: [] }
      ];
      // Dano: acao:1, alcance:1, duracao:0
      // Cura: acao:1, alcance:2, duracao:0
      // Menores: acao: 1, alcance: 1, duracao: 0
      const params = calcularParametrosPadrao(efs, todosEfeitosMock);
      expect(params).toEqual({ acao: 1, alcance: 1, duracao: 0 });
    });
  });

  describe('calcularCustoEfeito', () => {
    it('deve calcular o custo total do efeito (custoPorGrau * grau) + custoFixo', () => {
      const efAplicado: EfeitoAplicado = {
        id: 'ef-1',
        efeitoBaseId: 'dano',
        grau: 3,
        modificacoesLocais: [{ id: 'ma-1', modificacaoBaseId: 'area', escopo: 'local' }]
      };
      const custo = calcularCustoEfeito(mockEfeitoDano, efAplicado, [], todasModificacoesMock, 0);
      // custoPorGrau = 2. grau = 3. custoFixo = 1. Total = 2*3 + 1 = 7.
      expect(custo).toBe(7);
    });

    it('deve tratar graus menores que 1 como grau 1 no cálculo', () => {
      const efAplicado: EfeitoAplicado = { id: 'ef-1', efeitoBaseId: 'dano', grau: 0, modificacoesLocais: [] };
      const custo = calcularCustoEfeito(mockEfeitoDano, efAplicado, [], todasModificacoesMock, 0);
      expect(custo).toBe(2); // grau 0 tratou como 1 -> 2 * 1 = 2
    });
  });

  describe('calcularCustoPoder', () => {
    it('deve somar o custo de múltiplos efeitos', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 2, modificacoesLocais: [] },
          { id: 'ef-2', efeitoBaseId: 'cura', grau: 1, modificacoesLocais: [] }
        ]
      });
      // Padrões do poder: acao: 1, alcance: 1 (menor entre 1 e 2), duracao: 0
      // Parâmetros do poder: acao: 1, alcance: 1, duracao: 0. Modificador global = 0.
      // Dano: 2 base * 2 grau = 4.
      // Cura: 1 base * 1 grau = 1.
      // Total = 5
      const custo = calcularCustoPoder(poder, todosEfeitosMock, todasModificacoesMock);
      expect(custo).toBe(5);
    });
  });

  describe('calcularPETotal', () => {
    const tabelaUniversal = [
      { grau: 1, pe: 2 },
      { grau: 2, pe: 4 },
      { grau: 3, pe: 6 },
    ];

    it('deve calcular PE baseado no efeito mais caro + 1 por efeito extra', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 2, modificacoesLocais: [] }, // grau 2 -> PE = 4
          { id: 'ef-2', efeitoBaseId: 'cura', grau: 1, modificacoesLocais: [] }  // grau 1 -> PE = 2
        ]
      });
      // Maior PE = 4. 1 extra = +1. Total = 5
      const pe = calcularPETotal(poder, todosEfeitosMock, todasModificacoesMock, tabelaUniversal);
      expect(pe).toBe(5);
    });

    it('deve somar bônus de PE de modificações tipo extra', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 2, modificacoesLocais: [] } // PE = 4
        ],
        modificacoesGlobais: [
          { id: 'ma-1', modificacaoBaseId: 'area', escopo: 'global' } // Area custoFixo = 1, tipo = extra
        ]
      });
      // PE maior = 4. Extra área = +1 (custoFixo 1 + custoPorGrau 0). Total = 5
      const pe = calcularPETotal(poder, todosEfeitosMock, todasModificacoesMock, tabelaUniversal);
      expect(pe).toBe(5);
    });

    it('deve dobrar PE se a modificacao PE Dobrado estiver ativa', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 2, modificacoesLocais: [] } // PE = 4
        ],
        modificacoesGlobais: [
          { id: 'ma-1', modificacaoBaseId: 'custo-pe-dobrado', escopo: 'global', parametros: { opcao: 'PE Dobrado' } }
        ]
      });
      const pe = calcularPETotal(poder, todosEfeitosMock, todasModificacoesMock, tabelaUniversal);
      expect(pe).toBe(8); // 4 * 2 = 8
    });

    it('deve reduzir PE pela metade se a modificacao PE pela Metade estiver ativa', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 3, modificacoesLocais: [] } // PE = 6
        ],
        modificacoesGlobais: [
          { id: 'ma-1', modificacaoBaseId: 'custo-pe-reduzido', escopo: 'global', parametros: { opcao: 'PE pela Metade' } }
        ]
      });
      const pe = calcularPETotal(poder, todosEfeitosMock, todasModificacoesMock, tabelaUniversal);
      expect(pe).toBe(3); // 6 / 2 = 3
    });
  });

  describe('calcularEspacosTotal', () => {
    const tabelaUniversal = [
      { grau: 1, espacos: 2 },
      { grau: 2, espacos: 4 },
      { grau: 3, espacos: 6 },
    ];

    it('deve calcular Espaços baseado no efeito mais caro + 1 por efeito extra', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 2, modificacoesLocais: [] }, // grau 2 -> Espaços = 4
          { id: 'ef-2', efeitoBaseId: 'cura', grau: 1, modificacoesLocais: [] }  // grau 1 -> Espaços = 2
        ]
      });
      // Maior Espaços = 4. 1 extra = +1. Total = 5
      const espacos = calcularEspacosTotal(poder, todosEfeitosMock, tabelaUniversal);
      expect(espacos).toBe(5);
    });

    it('deve dobrar Espaços se a modificacao Espaços Dobrados estiver ativa', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 2, modificacoesLocais: [] } // Espaços = 4
        ],
        modificacoesGlobais: [
          { id: 'ma-1', modificacaoBaseId: 'custo-pe-dobrado', escopo: 'global', parametros: { opcao: 'Espaços Dobrados' } }
        ]
      });
      const espacos = calcularEspacosTotal(poder, todosEfeitosMock, tabelaUniversal);
      expect(espacos).toBe(8); // 4 * 2 = 8
    });
  });

  describe('calcularDetalhesPoder', () => {
    it('deve retornar detalhes completos com PdA, PE e Espaços', () => {
      const poder = makeFakePoder({
        efeitos: [
          { id: 'ef-1', efeitoBaseId: 'dano', grau: 1, modificacoesLocais: [] }
        ]
      });
      const result = calcularDetalhesPoder(poder, todosEfeitosMock, todasModificacoesMock);
      expect(result).toHaveProperty('custoPdATotal');
      expect(result).toHaveProperty('peTotal');
      expect(result).toHaveProperty('espacosTotal');
      expect(result).toHaveProperty('efeitosDetalhados');
      expect(result.efeitosDetalhados.length).toBe(1);
    });
  });

});
