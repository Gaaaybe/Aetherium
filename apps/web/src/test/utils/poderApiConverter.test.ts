import { describe, it, expect } from 'vitest';
import {
  poderResponseToPoder,
  poderResponseToPoderSalvo,
  acervoResponseToAcervo,
  poderToCreatePayload,
  legacyPoderToCreatePayload,
  type PoderLegacy
} from '../../features/criador-de-poder/utils/poderApiConverter';
import { PoderResponse, AcervoResponse } from '@/services/types';

// Fixture de PoderResponse mockado da API
const mockPoderResponse: PoderResponse = {
  id: 'p-id',
  nome: 'Fogo Rúnico',
  descricao: 'Causa queimaduras intensas de runas.',
  icone: 'https://example.com/icon.png',
  dominio: {
    name: 'sagrado',
  },
  parametros: {
    acao: 1,
    alcance: 2,
    duracao: 0
  },
  effects: [
    {
      id: 'e-1',
      effectBaseId: 'dano',
      grau: 2,
      configuracaoId: 'op1',
      inputValue: 'fogo',
      dadoModularizado: '1d6',
      modifications: [
        {
          modificationBaseId: 'area',
          scope: 'local',
          grau: 1,
          parametros: { tamanho: 5 }
        }
      ]
    }
  ],
  globalModifications: [
    {
      modificationBaseId: 'custo-pe-dobrado',
      scope: 'global',
      grau: 1
    }
  ],
  custoTotal: {
    pda: 4,
    pe: 2,
    espacos: 2
  },
  createdAt: '2026-07-04T12:00:00Z',
  updatedAt: '2026-07-04T13:00:00Z'
};

describe('Conversor de API de Poder - poderApiConverter.ts', () => {

  describe('poderResponseToPoder', () => {
    it('deve lançar erro se o argumento for nulo', () => {
      expect(() => poderResponseToPoder(null as any)).toThrow();
    });

    it('deve converter PoderResponse para o formato interno do editor corretamente', () => {
      const poder = poderResponseToPoder(mockPoderResponse);
      expect(poder.id).toBe('p-id');
      expect(poder.nome).toBe('Fogo Rúnico');
      expect(poder.descricao).toBe('Causa queimaduras intensas de runas.');
      expect(poder.icone).toBe('https://example.com/icon.png');
      expect(poder.dominioId).toBe('sagrado');
      expect(poder.acao).toBe(1);
      expect(poder.alcance).toBe(2);
      expect(poder.duracao).toBe(0);
      expect(poder.efeitos.length).toBe(1);
      expect(poder.efeitos[0].dadoModularizado).toBe('1d6');
      expect(poder.efeitos[0].modificacoesLocais[0].modificacaoBaseId).toBe('area');
      expect(poder.modificacoesGlobais.length).toBe(1);
      expect(poder.modificacoesGlobais[0].modificacaoBaseId).toBe('custo-pe-dobrado');
    });
  });

  describe('poderResponseToPoderSalvo', () => {
    it('deve conter propriedades convertidas e os campos de data de criação e modificação', () => {
      const poderSalvo = poderResponseToPoderSalvo(mockPoderResponse);
      expect(poderSalvo.dataCriacao).toBe('2026-07-04T12:00:00Z');
      expect(poderSalvo.dataModificacao).toBe('2026-07-04T13:00:00Z');
    });
  });

  describe('acervoResponseToAcervo', () => {
    it('deve converter AcervoResponse da API para o formato de Acervo legado', () => {
      const mockAcervoResponse: AcervoResponse = {
        id: 'ac-1',
        nome: 'Acervo de Fogo',
        descricao: 'Lista de magias de piromancia',
        icone: 'https://example.com/acervo.png',
        powers: [mockPoderResponse],
        dominio: {
          name: 'sagrado'
        },
        custoTotal: {
          pda: 4,
          pe: 2,
          espacos: 2
        },
        createdAt: '2026-07-04T12:00:00Z',
        updatedAt: '2026-07-04T13:00:00Z'
      };

      const acervo = acervoResponseToAcervo(mockAcervoResponse);
      expect(acervo.id).toBe('ac-1');
      expect(acervo.nome).toBe('Acervo de Fogo');
      expect(acervo.descritor).toBe('Lista de magias de piromancia');
      expect(acervo.poderes.length).toBe(1);
      expect(acervo.poderes[0].nome).toBe('Fogo Rúnico');
      expect(acervo.custoTotal.pda).toBe(4);
    });
  });

  describe('poderToCreatePayload', () => {
    it('deve converter o modelo do editor em CreatePoderPayload para a API', () => {
      const poder = poderResponseToPoder(mockPoderResponse);
      const payload = poderToCreatePayload(poder);

      expect(payload.nome).toBe('Fogo Rúnico');
      expect(payload.descricao).toBe('Causa queimaduras intensas de runas.');
      expect(payload.icone).toBe('https://example.com/icon.png');
      expect(payload.dominio.name).toBe('sagrado');
      expect(payload.parametros.acao).toBe(1);
      expect(payload.effects.length).toBe(1);
      expect(payload.effects[0].effectBaseId).toBe('dano');
      expect(payload.effects[0].dadoModularizado).toBe('1d6');
      expect(payload.globalModifications.length).toBe(1);
      expect(payload.globalModifications[0].modificationBaseId).toBe('custo-pe-dobrado');
    });

    it('deve padronizar a descrição com tamanho mínimo exigido pela API', () => {
      const poder = poderResponseToPoder(mockPoderResponse);
      poder.descricao = 'Curto'; // menor que 10 caracteres
      const payload = poderToCreatePayload(poder);
      expect(payload.descricao.length).toBeGreaterThanOrEqual(10);
      expect(payload.descricao).toContain('Poder: Fogo Rúnico');
    });
  });

  describe('legacyPoderToCreatePayload', () => {
    it('deve reconhecer quando recebe um PoderResponse exportado e usar conversão normal', () => {
      const payload = legacyPoderToCreatePayload(mockPoderResponse);
      expect(payload.nome).toBe('Fogo Rúnico');
      expect(payload.effects.length).toBe(1);
    });

    it('deve converter um PoderLegacy vindo do localStorage', () => {
      const legacy: PoderLegacy = {
        nome: 'Toque Elétrico',
        descricao: 'Choque elétrico rápido.',
        dominioId: 'psiquico',
        acao: 2,
        alcance: 1,
        duracao: 0,
        efeitos: [
          {
            efeitoBaseId: 'dano',
            grau: 1,
            inputCustomizado: 'eletricidade'
          }
        ],
        icone: 'https://example.com/elec.png'
      };

      const payload = legacyPoderToCreatePayload(legacy);
      expect(payload.nome).toBe('Toque Elétrico');
      expect(payload.descricao).toBe('Choque elétrico rápido.');
      expect(payload.dominio.name).toBe('psiquico');
      expect(payload.effects.length).toBe(1);
      expect(payload.effects[0].effectBaseId).toBe('dano');
      expect(payload.effects[0].inputValue).toBe('eletricidade');
    });

    it('deve rebaixar domínio peculiar para natural se peculiarId não existir', () => {
      const legacy: PoderLegacy = {
        nome: 'Toque Fantasma',
        dominioId: 'peculiar' // sem dominioIdPeculiar
      };
      const payload = legacyPoderToCreatePayload(legacy);
      expect(payload.dominio.name).toBe('natural');
    });

    it('deve manter domínio peculiar se peculiarId existir', () => {
      const legacy: PoderLegacy = {
        nome: 'Toque Fantasma',
        dominioId: 'peculiar',
        dominioIdPeculiar: 'pec-id-123'
      };
      const payload = legacyPoderToCreatePayload(legacy);
      expect(payload.dominio.name).toBe('peculiar');
      expect(payload.dominio.peculiarId).toBe('pec-id-123');
    });

    it('deve remover ícone se não for uma URL válida', () => {
      const legacy: PoderLegacy = {
        nome: 'Toque Elétrico',
        icone: 'icone-invalido-nao-url'
      };
      const payload = legacyPoderToCreatePayload(legacy);
      expect(payload.icone).toBeUndefined(); // limpou por não ser URL
    });
  });

});
