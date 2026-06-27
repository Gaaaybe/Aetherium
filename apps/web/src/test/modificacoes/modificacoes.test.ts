import { describe, it, expect } from 'vitest';
import { calcularDetalhesPoder } from '../../features/criador-de-poder/regras/calculadoraCusto';
import { EFEITOS, MODIFICACOES } from '../../data';
import type { Poder } from '../../features/criador-de-poder/regras/calculadoraCusto';

describe('Testes de Modificações', () => {
  // Poder base simples: Afligir 10 com parâmetros DEFAULT do efeito (evita custo mínimo de 1/grau)
  // Afligir tem custoBase 2 e parametrosPadrao {acao:1, alcance:1, duracao:0}
  // Usar os mesmos parâmetros resulta em modificadorParametros = 0
  // Logo: custoPorGrau = 2, custo total = 2×10 = 20 PdA
  const criarPoderBase = (): Poder => ({
    id: 'test-poder',
    nome: 'Poder de Teste',
    dominioId: 'natural',
    efeitos: [{
      id: 'efeito-1',
      efeitoBaseId: 'afligir',
      grau: 10,
      modificacoesLocais: []
    }],
    modificacoesGlobais: [],
    acao: 1,  // ação padrão (mesmo do efeito)
    alcance: 1,  // corpo-a-corpo (mesmo do efeito)
    duracao: 0  // instantâneo (mesmo do efeito)
  });

  describe('Falhas - Devem REDUZIR custo', () => {
    it('Custo base deve ser 20 PdA (2/grau × 10)', () => {
      const poder = criarPoderBase();
      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(20); // Afligir custoBase=2, sem modificadores
    });

    it('Efeito Colateral "Apenas ao Falhar" deve reduzir 1/grau', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'efeito-colateral',
        escopo: 'global',
        parametros: {
          configuracaoSelecionada: 'ao-falhar',
          descricao: 'Causa dano a você'
        }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(10); // (2-1)/grau × 10 = 10 PdA
    });

    it('Efeito Colateral "Toda Vez" deve reduzir 2/grau', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'efeito-colateral',
        escopo: 'global',
        parametros: {
          configuracaoSelecionada: 'sempre',
          descricao: 'Causa dano a você'
        }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(10); // max(1, 2-2) × 10 = 10 PdA (mínimo aplicado)
    });

    it('Distância Reduzida deve reduzir 1/grau', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'distancia-reduzida',
        escopo: 'global',
        grauModificacao: 1,
        parametros: { grau: 1 }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(10); // (2-1)/grau × 10 = 10 PdA
    });

    it('Cansativo deve reduzir 1/grau', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'cansativo',
        escopo: 'global'
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(10); // (2-1)/grau × 10 = 10 PdA
    });
  });

  describe('Extras - Devem AUMENTAR custo', () => {
    it('Área deve aumentar 1/grau', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'area',
        escopo: 'global',
        grauModificacao: 1,
        parametros: { grau: 1 }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(30); // (2+1)/grau × 10 = 30 PdA
    });

    it('Afeta Corpóreo deve aumentar 1/grau', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'afeta-corporeo',
        escopo: 'global'
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(30); // (2+1)/grau × 10 = 30 PdA
    });

    it('À Distância Estendido deve aumentar 1/grau', () => {
      const poder = criarPoderBase();
      // Mudar para alcance À Distância antes de aplicar a modificação
      poder.alcance = 2; // À Distância
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'a-distancia-estendido',
        escopo: 'global',
        grauModificacao: 1,
        parametros: { grau: 1 }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      // Base com alcance 2 = +1/grau, então (2+1)/grau × 10 = 30 PdA
      // Mais À Distância Estendido = +1/grau, total = (2+1+1)/grau × 10 = 40 PdA
      expect(detalhes.custoPdATotal).toBeGreaterThan(20);
    });

    it('Múltiplas modificações de grau devem acumular', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'area',
        escopo: 'global',
        grauModificacao: 1,
        parametros: { grau: 1 }
      });
      poder.modificacoesGlobais.push({
        id: 'mod-2',
        modificacaoBaseId: 'afeta-corporeo',
        escopo: 'global',
        grauModificacao: 1,
        parametros: { grau: 1 }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(40); // (2 + 1×2)/grau × 10 = 40 PdA
    });
  });

  describe('Modificações de Custo de PE/Espaços', () => {
    it('PE Dobrado deve dobrar o PE e reduzir PdA', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'custo-pe-dobrado',
        escopo: 'global',
        parametros: { opcao: 'PE Dobrado' }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(10); // (2-2)/grau × 10, mínimo 1 = 10 PdA (falha de -2/grau)
    });

    it('PE Reduzido deve reduzir PE pela metade e aumentar PdA', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'custo-pe-reduzido',
        escopo: 'global',
        parametros: { opcao: 'PE pela Metade' }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(40); // (2+2)/grau × 10 = 40 PdA (extra de +2/grau)
    });

    it('Espaços Dobrados deve afetar apenas Espaços', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'custo-pe-dobrado',
        escopo: 'global',
        parametros: { opcao: 'Espaços Dobrados' }
      });

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      expect(detalhes.custoPdATotal).toBe(10); // (2-2)/grau × 10, mínimo 1 = 10 PdA (falha de -2/grau)
    });
  });

  describe('Extras aumentam PE de ativação', () => {
    it('Extra com custoFixo deve aumentar PE', () => {
      const poderBase = criarPoderBase();
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'afeta-intangivel',
        escopo: 'global'
      });

      const detalhesBase = calcularDetalhesPoder(poderBase, EFEITOS, MODIFICACOES);
      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      // PE deve aumentar (custoFixo: 1)
      expect(detalhes.peTotal).toBeGreaterThan(detalhesBase.peTotal);
      expect(detalhes.peTotal).toBe(detalhesBase.peTotal + 1);
    });

    it('Extra com custoPorGrau deve aumentar PE pelo valor base', () => {
      const poderBase = criarPoderBase();
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'afeta-corporeo',
        escopo: 'global'
      });

      const detalhesBase = calcularDetalhesPoder(poderBase, EFEITOS, MODIFICACOES);
      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      // PE deve aumentar em 1 (custoPorGrau: 1, não multiplicado pelo grau)
      expect(detalhes.peTotal).toBeGreaterThan(detalhesBase.peTotal);
      expect(detalhes.peTotal).toBe(detalhesBase.peTotal + 1);
    });

    it('Modificações de custo especiais NÃO devem aumentar PE como extras normais', () => {
      const poderBase = criarPoderBase();
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'custo-pe-reduzido',
        escopo: 'global',
        parametros: { opcao: 'PE pela Metade' }
      });

      const detalhesBase = calcularDetalhesPoder(poderBase, EFEITOS, MODIFICACOES);
      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      // PE deve ser metade do base, não base + custo do modificador
      expect(detalhes.peTotal).toBeLessThan(detalhesBase.peTotal);
    });
  });

  describe('Modificações Locais vs Globais', () => {
    it('Modificação local deve afetar apenas o efeito específico', () => {
      const poderComLocal = criarPoderBase();
      poderComLocal.efeitos[0].modificacoesLocais.push({
        id: 'mod-1',
        modificacaoBaseId: 'area',
        escopo: 'local',
        grauModificacao: 1,
        parametros: { grau: 1 }
      });

      const poderComGlobal = criarPoderBase();
      poderComGlobal.modificacoesGlobais.push({
        id: 'mod-1',
        modificacaoBaseId: 'area',
        escopo: 'global',
        grauModificacao: 1,
        parametros: { grau: 1 }
      });

      const detalhesLocal = calcularDetalhesPoder(poderComLocal, EFEITOS, MODIFICACOES);
      const detalhesGlobal = calcularDetalhesPoder(poderComGlobal, EFEITOS, MODIFICACOES);
      
      // Ambos devem ter o mesmo custo total (1 efeito com +1/grau)
      expect(detalhesLocal.custoPdATotal).toBe(30); // (2+1)/grau × 10 = 30 PdA
      expect(detalhesGlobal.custoPdATotal).toBe(30);
    });
  });

  describe('Casos Extremos', () => {
    it('Múltiplas falhas devem acumular reduções', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push(
        {
          id: 'mod-1',
          modificacaoBaseId: 'cansativo',
          escopo: 'global'
        },
        {
          id: 'mod-2',
          modificacaoBaseId: 'distancia-reduzida',
          escopo: 'global',
          grauModificacao: 1,
          parametros: { grau: 1 }
        }
      );

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      // Deve reduzir -1-1 = -2/grau, mas custo mínimo 1/grau
      // (2-2)/grau × 10 = max(1, 0) × 10 = 10 PdA
      expect(detalhes.custoPdATotal).toBe(10);
    });

    it('Múltiplos extras devem acumular aumentos', () => {
      const poder = criarPoderBase();
      poder.modificacoesGlobais.push(
        {
          id: 'mod-1',
          modificacaoBaseId: 'afeta-corporeo',
          escopo: 'global'
        },
        {
          id: 'mod-2',
          modificacaoBaseId: 'afeta-intangivel',
          escopo: 'global'
        }
      );

      const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      
      // afeta-corporeo: +1/grau, afeta-intangivel: +1 fixo
      // (2+1)/grau × 10 + 1 = 31 PdA
      expect(detalhes.custoPdATotal).toBe(31);
    });

    it('Grau negativo deve custar como grau 1', () => {
      const poder = criarPoderBase();
      poder.efeitos[0].grau = -3;

      const poderGrau1 = criarPoderBase();
      poderGrau1.efeitos[0].grau = 1;

      const detalhesNegativo = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
      const detalhesGrau1 = calcularDetalhesPoder(poderGrau1, EFEITOS, MODIFICACOES);
      
      expect(detalhesNegativo.custoPdATotal).toBe(2); // 2/grau × 1 = 2 PdA
      expect(detalhesGrau1.custoPdATotal).toBe(2);
    });
  });
});
