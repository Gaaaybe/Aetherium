import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button, Slider, Select, Input } from '../../../shared/ui';
import { TABELA_UNIVERSAL, DOMINIOS, buscarGrauNaTabela } from '../../../data';
import { useCatalog } from '@/context/useCatalog';
import { useState, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronUp, Settings, Sparkles, AlertTriangle, Trash2, 
  Swords, Ruler, Zap, Package, Weight, Clock, Rocket, Move, AlertCircle, X 
} from 'lucide-react';
import { SeletorModificacao } from './SeletorModificacao';
import type { EfeitoDetalhado } from '../types';

interface CardEfeitoProps {
  efeitoDetalhado: EfeitoDetalhado;
  onRemover: (id: string) => void;
  onAtualizarGrau: (id: string, grau: number) => void;
  onAdicionarModificacao: (efeitoId: string, modId: string, parametros?: Record<string, any>, modificacaoId?: string) => void;
  onRemoverModificacao: (efeitoId: string, modId: string) => void;
  onAtualizarInputCustomizado?: (id: string, valor: string) => void;
  onAtualizarConfiguracao?: (id: string, configuracaoId: string) => void;
  onAtualizarDadoModularizado?: (id: string, dado: string) => void;
}

function obterModulacoesDeDados(formulaOriginal: string): Array<{ label: string; formula: string; dados: number; faces: number }> {
  if (!formulaOriginal) return [];
  const match = formulaOriginal.match(/^(\d+)d(\d+)$/i);
  if (!match) return [];
  const numDadosOriginal = parseInt(match[1], 10);
  const facesOriginal = parseInt(match[2], 10);
  const totalFaces = numDadosOriginal * facesOriginal;
  
  const opcoes: Array<{ label: string; formula: string; dados: number; faces: number }> = [];
  
  for (let Y = 1; Y <= 10; Y++) {
    if (totalFaces % Y === 0) {
      const Z = totalFaces / Y;
      if (Z >= 2) {
        opcoes.push({
          label: `${Y}d${Z}`,
          formula: `${Y}d${Z}`,
          dados: Y,
          faces: Z
        });
      }
    }
  }
  return opcoes;
}

export interface FortaleceAlvo {
  tipo: 'atributo' | 'pericia';
  alvo: string;
  bonus: number;
}

export const ATRIBUTOS_OPCOES = [
  { value: 'strength', label: 'FOR (Força)' },
  { value: 'dexterity', label: 'DES (Destreza)' },
  { value: 'constitution', label: 'CON (Constituição)' },
  { value: 'intelligence', label: 'INT (Inteligência)' },
  { value: 'wisdom', label: 'SAB (Sabedoria)' },
  { value: 'charisma', label: 'CAR (Carisma)' },
];

export const PERICIAS_OPCOES = [
  { value: 'Atletismo', label: 'Atletismo' },
  { value: 'Acrobacia', label: 'Acrobacia' },
  { value: 'Cavalgar', label: 'Cavalgar' },
  { value: 'Furtividade', label: 'Furtividade' },
  { value: 'Iniciativa', label: 'Iniciativa' },
  { value: 'Ladinagem', label: 'Ladinagem' },
  { value: 'Pilotar', label: 'Pilotar' },
  { value: 'Reflexos', label: 'Reflexos' },
  { value: 'Fortitude', label: 'Fortitude' },
  { value: 'Conhecimento', label: 'Conhecimento' },
  { value: 'Espiritismo', label: 'Espiritismo' },
  { value: 'Investigação', label: 'Investigação' },
  { value: 'Adestrar Animais', label: 'Adestrar Animais' },
  { value: 'Cura', label: 'Cura' },
  { value: 'Exploração', label: 'Exploração' },
  { value: 'Intuição', label: 'Intuição' },
  { value: 'Percepção', label: 'Percepção' },
  { value: 'Religião', label: 'Religião' },
  { value: 'Sobrevivência', label: 'Sobrevivência' },
  { value: 'Atuação', label: 'Atuação' },
  { value: 'Diplomacia', label: 'Diplomacia' },
  { value: 'Enganação', label: 'Enganação' },
  { value: 'Intimidação', label: 'Intimidação' },
  { value: 'Vontade', label: 'Vontade' },
];

export function obterBonusFortalecerPorGrau(grau: number): number {
  if (grau <= 0) return 0;
  if (grau === 1) return 3;
  if (grau === 2) return 5;
  if (grau === 3) return 10;
  return 10 + (grau - 3) * 15;
}

export function parseAlocacoes(input: string | undefined, tipoPadrao: 'atributo' | 'pericia', bonusPadrao: number): FortaleceAlvo[] {
  if (!input) return [];
  try {
    const trimmed = input.trim();
    if (trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
    if (trimmed) {
      return [{ tipo: tipoPadrao, alvo: trimmed, bonus: bonusPadrao }];
    }
    return [];
  } catch (e) {
    if (input) {
      return [{ tipo: tipoPadrao, alvo: input, bonus: bonusPadrao }];
    }
    return [];
  }
}

export interface FortalecerDanoRecuperacaoInput {
  alvo: {
    tipo: 'DOMINIO' | 'DESARMADO' | 'ITEM';
    dominio?: string;
  };
  bonusDescritor: string;
}

export function parseFortalecerDanoRecuperacao(input: string | undefined): FortalecerDanoRecuperacaoInput {
  if (input) {
    try {
      const parsed = JSON.parse(input);
      if (parsed && parsed.alvo && typeof parsed.alvo === 'object') {
        return {
          alvo: {
            tipo: parsed.alvo.tipo === 'DESARMADO' ? 'DESARMADO' : parsed.alvo.tipo === 'ITEM' ? 'ITEM' : 'DOMINIO',
            dominio: parsed.alvo.dominio || 'natural',
          },
          bonusDescritor: parsed.bonusDescritor || '',
        };
      }
    } catch (e) {
      // ignore
    }
  }
  return {
    alvo: { tipo: 'DOMINIO', dominio: 'natural' },
    bonusDescritor: '',
  };
}

export interface FortalecerCaracteristicaItemInput {
  alvo: {
    tipo: 'ITEM' | 'DESARMADO';
  };
}

export function parseFortalecerCaracteristicaItem(input: string | undefined): FortalecerCaracteristicaItemInput {
  if (input) {
    try {
      const parsed = JSON.parse(input);
      if (parsed && parsed.alvo && typeof parsed.alvo === 'object') {
        return {
          alvo: {
            tipo: parsed.alvo.tipo === 'DESARMADO' ? 'DESARMADO' : 'ITEM',
          },
        };
      }
    } catch (e) {
      // ignore
    }
  }
  return {
    alvo: { tipo: 'ITEM' },
  };
}

export function formatarInputCustomizado(
  input: string | undefined,
  efeitoBaseId: string,
  configId?: string,
  grau?: number
): string {
  const g = grau || 1;
  if (efeitoBaseId === 'fortalecer') {
    if (configId === 'acoes') {
      let bonus = 0;
      if (g >= 10) bonus = 3;
      else if (g >= 6) bonus = 2;
      else if (g >= 2) bonus = 1;
      return `+${bonus} ${bonus !== 1 ? 'Ações' : 'Ação'}`;
    }
    if (configId === 'rd') {
      const bonus = 2 * Math.pow(2, g - 1);
      return `+${bonus} RD`;
    }
    if (configId === 'pe') {
      return `+${g * 4} PE Temp`;
    }
    if (configId === 'pv') {
      const tableItem = buscarGrauNaTabela(g);
      const formula = tableItem?.dano || '1d6';
      return `${formula} PV Temp`;
    }

    if (configId && ['critico-multiplicador', 'critico-margem', 'alcance'].includes(configId)) {
      if (!input || input.trim() === '[]' || input.trim() === '{}' || input.trim() === '') {
        return 'Próprio Item';
      }
    }

    const trimmed = input ? input.trim() : '';
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.alvo) {
          const alvoStr = parsed.alvo.tipo === 'DESARMADO'
            ? 'Desarmado'
            : parsed.alvo.tipo === 'ITEM'
            ? 'Próprio Item'
            : (DOMINIOS.find(d => d.id === parsed.alvo.dominio)?.nome || parsed.alvo.dominio || '');
          const descritorStr = parsed.bonusDescritor ? ` (${parsed.bonusDescritor})` : '';
          return `${alvoStr}${descritorStr}`;
        }
      } catch (e) {
        // ignore
      }
    }
    try {
      if (trimmed.startsWith('[')) {
        const alocacoes = JSON.parse(trimmed) as FortaleceAlvo[];
        if (alocacoes.length === 0) return '';
        return alocacoes
          .map(item => {
            const labelAlvo = item.tipo === 'atributo'
              ? ATRIBUTOS_OPCOES.find(o => o.value === item.alvo)?.label.split(' ')[0] || item.alvo.toUpperCase()
              : item.alvo;
            return `+${item.bonus} ${labelAlvo}`;
          })
          .join(', ');
      }
    } catch (e) {
      // Fallback
    }
  }
  return input || '';
}


export function CardEfeito({
  efeitoDetalhado,
  onRemover,
  onAtualizarGrau,
  onAdicionarModificacao,
  onRemoverModificacao,
  onAtualizarInputCustomizado,
  onAtualizarConfiguracao,
  onAtualizarDadoModularizado,
}: CardEfeitoProps) {
  const { modificacoes: todasModificacoes } = useCatalog();
  
  const { efeito, efeitoBase, custoPorGrau, custoFixo, custoTotal } = efeitoDetalhado;
  const [modalModificacao, setModalModificacao] = useState(false);
  const [modificacaoEditando, setModificacaoEditando] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [alvoInput, setAlvoInput] = useState('');
  const [bonusInput, setBonusInput] = useState(1);

  // Formata o custo de uma modificação para exibição
  const formatarCustoModificacao = (mod: any, modBase: any) => {
    if (!modBase) return '';
    
    let custo = '';
    const grauMod = mod.grauModificacao || 1;
    
    // Custo por grau
    let custoPorGrauMod = modBase.custoPorGrau || 0;
    let custoFixoMod = modBase.custoFixo || 0;
    
    // Aplica modificador da configuração
    if (mod.parametros?.configuracaoSelecionada && modBase.configuracoes) {
      const configuracao = modBase.configuracoes.opcoes.find(
        (opt: any) => opt.id === mod.parametros?.configuracaoSelecionada
      );
      if (configuracao) {
        // Modificador por grau (ex: Efeito Colateral Menor = -1/grau)
        if (configuracao.modificadorCusto !== undefined) {
          custoPorGrauMod += configuracao.modificadorCusto;
        }
        // Modificador fixo (ex: Sutil Difícil = +1 fixo, Indetectável = +2 fixo)
        if (configuracao.modificadorCustoFixo !== undefined) {
          custoFixoMod += configuracao.modificadorCustoFixo;
        }
      }
    }
    
    const custoPorGrauTotal = custoPorGrauMod * grauMod;
    
    // Formata custo por grau
    if (custoPorGrauTotal !== 0) {
      const sinal = custoPorGrauTotal > 0 ? '+' : '';
      custo = `${sinal}${custoPorGrauTotal}/grau`;
    }
    
    // Formata custo fixo
    if (custoFixoMod !== 0) {
      const sinal = custoFixoMod > 0 ? '+' : '';
      if (custo) {
        custo += `, ${sinal}${custoFixoMod} fixo`;
      } else {
        custo = `${sinal}${custoFixoMod} fixo`;
      }
    }
    
    return custo ? ` (${custo})` : '';
  };
  
  // Proteção contra dados inválidos
  if (!efeito || !efeitoBase) {
    console.error('Dados do efeito inválidos:', efeitoDetalhado);
    return null;
  }
  
  // Busca dados da tabela universal
  const dadosGrau = useMemo(() => {
    return TABELA_UNIVERSAL.find(t => t.grau === efeito.grau);
  }, [efeito.grau]);

  const formulaBase = dadosGrau?.dano || '1d6';
  const opcoesDados = useMemo(() => {
    return obterModulacoesDeDados(formulaBase);
  }, [formulaBase]);

  return (
    <>
      <Card hover className="transition-all duration-300 hover:shadow-xl border-l-4 border-l-espirito-500 dark:border-l-espirito-400">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-200"
                  title={isExpanded ? 'Recolher' : 'Expandir'}
                >
                  <ChevronRight className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-espirito-600 dark:text-espirito-400" />
                    {efeitoBase.nome}
                  </CardTitle>
                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                    Grau {efeito.grau} • {efeito.inputCustomizado && `${formatarInputCustomizado(efeito.inputCustomizado, efeitoBase.id, efeito.configuracaoSelecionada, efeito.grau)} • `}
                    {custoPorGrau} PdA/grau
                  </p>
                  
                  {/* Configuração selecionada quando colapsado */}
                  {/* Configuração selecionada quando colapsado */}
                  {!isExpanded && efeito.configuracaoSelecionada && efeitoBase.configuracoes && (
                    <div className="mt-1">
                      <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        {efeitoBase.configuracoes.opcoes.find((c: any) => c.id === efeito.configuracaoSelecionada)?.nome}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Modificações quando colapsado */}
                  {!isExpanded && efeito.modificacoesLocais.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {efeito.modificacoesLocais.map((mod: any) => {
                        const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
                        return (
                          <Badge 
                            key={mod.id}
                            variant={modBase?.tipo === 'extra' ? 'success' : 'warning'}
                            size="sm"
                            title={modBase?.descricao}
                            className="flex items-center gap-1"
                          >
                            {modBase?.tipo === 'extra' ? <Sparkles className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {modBase?.nome || mod.modificacaoBaseId}
                            {mod.grauModificacao && ` (${mod.grauModificacao})`}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge variant="espirito" size="lg" className="bg-gradient-to-r from-espirito-600 to-espirito-500 dark:from-espirito-500 dark:to-espirito-400 shadow-lg shadow-espirito-500/30 hover:shadow-xl transition-all flex items-center gap-1">
                <Weight className="w-4 h-4" />
                {custoTotal} PdA
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemover(efeito.id)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-950/30 hover:scale-105 transition-all duration-200 group"
              >
                <Trash2 className="w-4 h-4 group-hover:animate-pulse" /> Remover
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
        <CardContent className="space-y-4">
          {/* Slider de Grau */}
          <Slider
            label={`Grau do Efeito: ${efeito.grau}`}
            value={efeito.grau}
            min={-5}
            max={20}
            showValue
            onChange={(valor: number) => onAtualizarGrau(efeito.id, valor)}
          />

          {/* Informações da Tabela Universal */}
          {dadosGrau ? (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-lg border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
              {/* Campos Principais - Sempre Visíveis */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Swords className="w-3 h-3" /> Dano/Cura
                  </p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.dano}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Ruler className="w-3 h-3" /> Distância
                  </p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.distancia}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" /> PE
                  </p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.pe}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Package className="w-3 h-3" /> Espaços
                  </p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.espacos}</p>
                </div>
              </div>

              {/* Botão para Expandir/Colapsar */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full mt-3 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium flex items-center justify-center gap-1 transition-colors"
              >
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Mais detalhes da Tabela Universal</span>
              </button>

              {/* Campos Adicionais - Colapsáveis */}
              {showDetails && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                        <Weight className="w-3 h-3" /> Massa
                      </p>
                      <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.massa}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" /> Tempo
                      </p>
                      <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.tempo}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                        <Rocket className="w-3 h-3" /> Velocidade
                      </p>
                      <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.velocidade}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-center gap-1">
                        <Move className="w-3 h-3" /> Deslocamento
                      </p>
                      <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.deslocamento}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Grau {efeito.grau} não encontrado na tabela universal. Recarregue a página (Ctrl+R ou Cmd+R).
              </p>
            </div>
          )}

          {/* Input Customizado (se o efeito requer) */}
          {efeitoBase.requerInput &&
           efeito.configuracaoSelecionada !== 'pv' &&
           efeito.configuracaoSelecionada !== 'pe' &&
           (efeitoBase.id === 'fortalecer' || (
             efeito.configuracaoSelecionada !== 'critico-margem' &&
             efeito.configuracaoSelecionada !== 'critico-multiplicador'
           )) &&
           efeito.configuracaoSelecionada !== 'acoes' &&
           onAtualizarInputCustomizado && (
            <>
              {efeitoBase.id === 'fortalecer' && (efeito.configuracaoSelecionada === 'atributo' || efeito.configuracaoSelecionada === 'pericia') ? (
                (() => {
                  const bonusMax = obterBonusFortalecerPorGrau(efeito.grau);
                  const tipoSelecionado = (efeito.configuracaoSelecionada as 'atributo' | 'pericia') || 'atributo';
                  const alocacoes = parseAlocacoes(efeito.inputCustomizado, tipoSelecionado, bonusMax);
                  const somaAlocada = alocacoes.reduce((sum, item) => sum + item.bonus, 0);
                  
                  return (
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-200 dark:border-amber-900/50 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">Distribuição do Bônus</span>
                        <Badge className="bg-amber-600 text-white font-black border-none text-[10px]">Total: +{bonusMax}</Badge>
                      </div>

                       {/* Lista de Alocações */}
                      {alocacoes.length > 0 ? (
                        <div className="space-y-1.5">
                          {alocacoes.map((item, idx) => {
                            const labelAlvo = item.tipo === 'atributo' 
                              ? ATRIBUTOS_OPCOES.find(o => o.value === item.alvo)?.label || item.alvo
                              : item.alvo;
                            return (
                              <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-900 p-1.5 px-2.5 rounded border border-amber-100 dark:border-amber-900/30 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                                <span>{labelAlvo}</span>
                                <div className="flex items-center gap-3">
                                  {/* Controles de Incremento e Decremento */}
                                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200/50 dark:border-amber-900/50 p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const novas = alocacoes
                                          .map((a, i) => i === idx ? { ...a, bonus: a.bonus - 1 } : a)
                                          .filter(a => a.bonus > 0);
                                        onAtualizarInputCustomizado?.(efeito.id, JSON.stringify(novas));
                                      }}
                                      className="w-5 h-5 flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded font-black text-sm transition-colors"
                                      title="Diminuir bônus"
                                    >
                                      -
                                    </button>
                                    <span className="text-amber-600 dark:text-amber-400 font-black min-w-[20px] text-center">+{item.bonus}</span>
                                    <button
                                      type="button"
                                      disabled={somaAlocada >= bonusMax}
                                      onClick={() => {
                                        if (somaAlocada < bonusMax) {
                                          const novas = alocacoes.map((a, i) => i === idx ? { ...a, bonus: a.bonus + 1 } : a);
                                          onAtualizarInputCustomizado?.(efeito.id, JSON.stringify(novas));
                                        }
                                      }}
                                      className="w-5 h-5 flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Aumentar bônus"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const novas = alocacoes.filter((_, i) => i !== idx);
                                      onAtualizarInputCustomizado?.(efeito.id, JSON.stringify(novas));
                                    }}
                                    className="text-red-500 hover:text-red-700 p-0.5 transition-colors"
                                    title="Remover alocação"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Nenhum bônus alocado ainda.</p>
                      )}

                      {/* Adicionar Bônus */}
                      {somaAlocada < bonusMax && (
                        <div className="flex gap-2 items-end pt-1 border-t border-dashed border-amber-200 dark:border-amber-900/50">
                          <div className="flex-1">
                            <label className="text-[9px] font-black uppercase text-amber-600 tracking-wider">Alvo</label>
                            <select
                              value={alvoInput || (tipoSelecionado === 'atributo' ? 'strength' : 'Atletismo')}
                              onChange={(e) => setAlvoInput(e.target.value)}
                              className="w-full h-8 text-xs font-bold bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded px-2 outline-none text-gray-700 dark:text-gray-300"
                            >
                              {(tipoSelecionado === 'atributo' ? ATRIBUTOS_OPCOES : PERICIAS_OPCOES).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-20">
                            <label className="text-[9px] font-black uppercase text-amber-600 tracking-wider">Bônus</label>
                            <input
                              type="number"
                              min={1}
                              max={bonusMax - somaAlocada}
                              value={bonusInput}
                              onChange={(e) => setBonusInput(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full h-8 text-xs text-center font-bold bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded outline-none text-gray-700 dark:text-gray-300"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 border-amber-300 text-amber-700 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                            onClick={() => {
                              const finalAlvo = alvoInput || (tipoSelecionado === 'atributo' ? 'strength' : 'Atletismo');
                              const existente = alocacoes.find(a => a.alvo === finalAlvo);
                              let novas: FortaleceAlvo[];
                              if (existente) {
                                novas = alocacoes.map(a => a.alvo === finalAlvo ? { ...a, bonus: a.bonus + bonusInput } : a);
                              } else {
                                novas = [...alocacoes, { tipo: tipoSelecionado, alvo: finalAlvo, bonus: bonusInput }];
                              }
                              onAtualizarInputCustomizado(efeito.id, JSON.stringify(novas));
                              setAlvoInput('');
                              setBonusInput(1);
                            }}
                          >
                            Alocar
                          </Button>
                        </div>
                      )}

                      {/* Status de Pontos */}
                      <div className="text-[10px] font-bold">
                        {somaAlocada < bonusMax && (
                          <p className="text-amber-600 dark:text-amber-400">Restam {bonusMax - somaAlocada} pontos de bônus para alocar.</p>
                        )}
                        {somaAlocada === bonusMax && (
                          <p className="text-emerald-600 dark:text-emerald-400">✓ Todos os pontos de bônus alocados!</p>
                        )}
                        {somaAlocada > bonusMax && (
                          <p className="text-red-500">⚠ A soma (+{somaAlocada}) excede o limite do grau (+{bonusMax})!</p>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : efeitoBase.id === 'fortalecer' && (efeito.configuracaoSelecionada === 'dano' || efeito.configuracaoSelecionada === 'recuperacao') ? (
                (() => {
                  const parsed = parseFortalecerDanoRecuperacao(efeito.inputCustomizado);
                  const updateConfig = (newVal: Partial<FortalecerDanoRecuperacaoInput>) => {
                    const merged = { ...parsed, ...newVal };
                    onAtualizarInputCustomizado(efeito.id, JSON.stringify(merged));
                  };

                  return (
                    <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/10 dark:to-orange-950/10 border border-red-200 dark:border-red-900/50 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-red-700 dark:text-red-400">
                          Configuração de {efeito.configuracaoSelecionada === 'dano' ? 'Dano' : 'Recuperação'}
                        </span>
                        <Badge className="bg-red-600 text-white font-black border-none text-[10px]">
                          Fortalecer
                        </Badge>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/40 rounded text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                        <span className="font-bold">Bônus Concedido (Grau {efeito.grau}):</span>
                        <span className="font-black text-red-600 dark:text-red-400 text-sm">
                          +{4 * Math.pow(2, Math.max(0, (efeito.grau || 1) - 1))} {parsed.bonusDescritor ? `[${parsed.bonusDescritor}]` : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Tipo de Alvo */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400">Tipo de Alvo</label>
                          <select
                            value={parsed.alvo.tipo}
                            onChange={(e) => {
                              const tipo = e.target.value as 'DOMINIO' | 'DESARMADO' | 'ITEM';
                              updateConfig({
                                alvo: tipo === 'DOMINIO' ? { tipo, dominio: 'natural' } : { tipo }
                              });
                            }}
                            className="w-full h-9 text-xs font-bold bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded px-2.5 outline-none text-gray-700 dark:text-gray-300"
                          >
                            <option value="DOMINIO">Por Domínio (Arma/Poder)</option>
                            <option value="DESARMADO">Ataque Desarmado</option>
                            <option value="ITEM">Próprio Item (Arma/Poderes do Item)</option>
                          </select>
                        </div>

                        {/* Domínio (se aplicável) */}
                        {parsed.alvo.tipo === 'DOMINIO' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Domínio Vinculado</label>
                            <select
                              value={parsed.alvo.dominio || 'natural'}
                              onChange={(e) => {
                                updateConfig({
                                  alvo: { tipo: 'DOMINIO', dominio: e.target.value }
                                });
                              }}
                              className="w-full h-9 text-xs font-bold bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded px-2.5 outline-none text-gray-700 dark:text-gray-300"
                            >
                              {DOMINIOS.filter(d => d.id !== 'desarmado').map((dom) => (
                                <option key={dom.id} value={dom.id}>
                                  {dom.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Descritor do Bônus */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-gray-400">
                            Descritor do Bônus (Ex: Fogo, Físico, Divino)
                          </label>
                          <Input
                            value={parsed.bonusDescritor}
                            onChange={(e) => updateConfig({ bonusDescritor: e.target.value })}
                            placeholder="Tipo/Descritor do bônus adicional..."
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : efeitoBase.id === 'fortalecer' && ['critico-multiplicador', 'critico-margem', 'alcance'].includes(efeito.configuracaoSelecionada || '') ? (
              (() => {
                const parsed = parseFortalecerCaracteristicaItem(efeito.inputCustomizado);
                const updateConfig = (newVal: Partial<FortalecerCaracteristicaItemInput>) => {
                  const merged = { ...parsed, ...newVal };
                  onAtualizarInputCustomizado?.(efeito.id, JSON.stringify(merged));
                };

                const configId = efeito.configuracaoSelecionada || '';
                const grau = efeito.grau || 1;

                let bonusLabel = '';
                if (configId === 'critico-multiplicador') {
                  const bonus = Math.floor(grau / 2);
                  bonusLabel = `+${bonus} Multiplicador de Crítico`;
                } else if (configId === 'critico-margem') {
                  const bonus = Math.floor(grau / 2);
                  bonusLabel = `-${bonus} na Margem de Crítico`;
                } else if (configId === 'alcance') {
                  const bonus = grau * 2;
                  bonusLabel = `+${bonus} metros no Alcance`;
                }

                return (
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-200 dark:border-amber-900/50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">
                        Fortalecer Características de Item
                      </span>
                      <Badge className="bg-amber-600 text-white font-black border-none text-[10px]">
                        Fortalecer
                      </Badge>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/40 rounded text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                      <span className="font-bold">Bônus Concedido (Grau {grau}):</span>
                      <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                        {bonusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">Alvo do Fortalecimento</label>
                        <select
                          value={parsed.alvo.tipo}
                          onChange={(e) => {
                            const tipo = e.target.value as 'ITEM' | 'DESARMADO';
                            updateConfig({
                              alvo: { tipo }
                            });
                          }}
                          className="w-full h-9 text-xs font-bold bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded px-2.5 outline-none text-gray-700 dark:text-gray-300"
                        >
                          <option value="ITEM">Próprio Item (Arma acoplada)</option>
                          <option value="DESARMADO">Ataque Desarmado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  {efeitoBase.tipoInput === 'select' && efeitoBase.opcoesInput ? (
                    <Select
                      label={efeitoBase.labelInput || 'Especificar'}
                      value={efeito.inputCustomizado || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onAtualizarInputCustomizado(efeito.id, e.target.value)}
                      options={efeitoBase.opcoesInput.map((op: string) => ({ value: op, label: op }))}
                    />
                  ) : (
                    <Input
                      label={efeitoBase.labelInput || 'Especificar'}
                      value={efeito.inputCustomizado || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAtualizarInputCustomizado(efeito.id, e.target.value)}
                      placeholder={efeitoBase.placeholderInput || ''}
                      maxLength={efeitoBase.id === 'dano' ? 30 : undefined}
                    />
                  )}
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Este efeito requer especificação
                  </p>
                </div>
              )}
            </>
          )}

          {/* Configuração (ex: Imunidade Patamar 1, 2, etc.) */}
          {efeitoBase.configuracoes && onAtualizarConfiguracao && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <Select
                label={efeitoBase.configuracoes.label}
                value={efeito.configuracaoSelecionada || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const newConfig = e.target.value;
                  onAtualizarConfiguracao(efeito.id, newConfig);
                  if (efeitoBase.id === 'fortalecer') {
                    onAtualizarInputCustomizado?.(efeito.id, '[]');
                  }
                }}
                options={efeitoBase.configuracoes.opcoes.map((config: any) => ({
                  value: config.id,
                  label: `${config.nome} (+${config.modificadorCusto} custo)${config.grauMinimo ? ` - Grau ${config.grauMinimo}+` : ''}`,
                }))}
              />
              {efeito.configuracaoSelecionada && (
                <div className="mt-2 text-xs text-purple-700 dark:text-purple-300 space-y-1">
                  <p className="font-semibold">
                    {efeitoBase.configuracoes.opcoes.find((c: any) => c.id === efeito.configuracaoSelecionada)?.descricao}
                  </p>
                  {efeitoBase.id === 'fortalecer' && (() => {
                    const g = efeito.grau || 1;
                    let calculatedLabel = '';
                    if (efeito.configuracaoSelecionada === 'acoes') {
                      let bonus = 0;
                      if (g >= 10) bonus = 3;
                      else if (g >= 6) bonus = 2;
                      else if (g >= 2) bonus = 1;
                      calculatedLabel = `Bônus do Grau ${g}: +${bonus} Ação${bonus !== 1 ? 'es' : ''} Padrão Extra${bonus !== 1 ? 's' : ''}`;
                    } else if (efeito.configuracaoSelecionada === 'rd') {
                      const bonus = 2 * Math.pow(2, g - 1);
                      calculatedLabel = `Bônus do Grau ${g}: +${bonus} de Redução de Dano (RD)`;
                    } else if (efeito.configuracaoSelecionada === 'pv') {
                      const formula = buscarGrauNaTabela(g)?.dano || '1d6';
                      calculatedLabel = `Bônus do Grau ${g}: Rolagem de ${formula} PV Temporário(s)`;
                    } else if (efeito.configuracaoSelecionada === 'pe') {
                      calculatedLabel = `Bônus do Grau ${g}: +${g * 4} PE Temporário(s)`;
                    }
                    return calculatedLabel ? (
                      <p className="font-black text-amber-700 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded mt-1.5 border border-amber-500/20">
                        {calculatedLabel}
                      </p>
                    ) : null;
                  })()}
                </div>
              )}
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 flex items-center gap-1">
                <Settings className="w-3 h-3" /> Configuração que altera o custo base
              </p>
            </div>
          )}

          {/* Modularização de Dados (apenas para efeito Dano) */}
          {efeitoBase.id === 'dano' && opcoesDados.length > 0 && onAtualizarDadoModularizado && (
            <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm">
              <Select
                label="Modularização dos Dados de Dano"
                value={efeito.dadoModularizado || formulaBase}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const valor = e.target.value;
                  onAtualizarDadoModularizado(efeito.id, valor === formulaBase ? '' : valor);
                }}
                options={[
                  { value: formulaBase, label: `${formulaBase} (Padrão)` },
                  ...opcoesDados.filter(opt => opt.formula !== formulaBase).map(opt => ({
                    value: opt.formula,
                    label: `${opt.formula} (Modularizado)`
                  }))
                ]}
              />
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" /> Modula a distribuição de dados sem alterar a soma total máxima de faces ({formulaBase.match(/^(\d+)d(\d+)$/i) ? parseInt(formulaBase.match(/^(\d+)d(\d+)$/i)![1], 10) * parseInt(formulaBase.match(/^(\d+)d(\d+)$/i)![2], 10) : 0}).
              </p>
            </div>
          )}

          {/* Detalhes do Custo */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Cálculo:</strong> ({custoPorGrau} PdA/grau × {efeito.grau} grau{efeito.grau > 1 ? 's' : ''}) + {custoFixo} fixo = <strong className="text-espirito-600 dark:text-espirito-400">{custoTotal} PdA</strong>
            </p>
          </div>

          {/* Modificações Locais */}
          {efeito.modificacoesLocais.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Modificações deste efeito:
              </p>
              <div className="flex flex-wrap gap-2">
                {efeito.modificacoesLocais.map((mod: any) => {
                  const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
                  const custoTexto = formatarCustoModificacao(mod, modBase);
                  
                  return (
                    <Badge 
                      key={mod.id}
                      variant={modBase?.tipo === 'extra' ? 'success' : 'warning'}
                      className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
                      onClick={() => {
                        setModificacaoEditando(mod);
                        setModalModificacao(true);
                      }}
                    >
                      <span>
                        {modBase?.nome || mod.modificacaoBaseId}
                        {mod.grauModificacao && ` ${mod.grauModificacao}`}
                        <span className="font-bold ml-1">{custoTexto}</span>
                      </span>
                      {mod.parametros?.descricao && (
                        <span className="text-xs opacity-75">: {mod.parametros.descricao}</span>
                      )}
                      {mod.parametros?.opcao && (
                        <span className="text-xs opacity-75">({mod.parametros.opcao})</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoverModificacao(efeito.id, mod.id);
                        }}
                        className="hover:text-red-600 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        title="Remover modificação"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        )}

        {isExpanded && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => setModalModificacao(true)}
            className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 transition-all duration-200 group"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:animate-spin" />
            Adicionar Modificação
          </Button>
        </CardFooter>
        )}
      </Card>

      <SeletorModificacao
        isOpen={modalModificacao}
        onClose={() => {
          setModalModificacao(false);
          setModificacaoEditando(null);
        }}
        modificacaoEdicao={modificacaoEditando}
        onSelecionar={(modId: string, parametros?: Record<string, any>, modificacaoId?: string) => {
          onAdicionarModificacao(efeito.id, modId, parametros, modificacaoId);
          setModalModificacao(false);
          setModificacaoEditando(null);
        }}
        titulo="Modificações Locais do Efeito"
      />
    </>
  );
}
