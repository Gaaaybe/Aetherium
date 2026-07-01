import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button, Slider, Select, Input } from '../../../shared/ui';
import { TABELA_UNIVERSAL } from '../../../data';
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
  onAdicionarModificacao: (efeitoId: string, modId: string, parametros?: Record<string, any>) => void;
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

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
                    Grau {efeito.grau} • {efeito.inputCustomizado && `${efeito.inputCustomizado} • `}
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
          {efeitoBase.requerInput && onAtualizarInputCustomizado && (
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
                />
              )}
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Este efeito requer especificação
              </p>
            </div>
          )}

          {/* Configuração (ex: Imunidade Patamar 1, 2, etc.) */}
          {efeitoBase.configuracoes && onAtualizarConfiguracao && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <Select
                label={efeitoBase.configuracoes.label}
                value={efeito.configuracaoSelecionada || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onAtualizarConfiguracao(efeito.id, e.target.value)}
                options={efeitoBase.configuracoes.opcoes.map((config: any) => ({
                  value: config.id,
                  label: `${config.nome} (+${config.modificadorCusto} custo)${config.grauMinimo ? ` - Grau ${config.grauMinimo}+` : ''}`,
                }))}
              />
              {efeito.configuracaoSelecionada && (
                <div className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                  <p className="font-semibold">
                    {efeitoBase.configuracoes.opcoes.find((c: any) => c.id === efeito.configuracaoSelecionada)?.descricao}
                  </p>
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
                      className="flex items-center gap-2"
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
                        onClick={() => onRemoverModificacao(efeito.id, mod.id)}
                        className="hover:text-red-600"
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
        onClose={() => setModalModificacao(false)}
        onSelecionar={(modId: string, parametros?: Record<string, any>) => {
          onAdicionarModificacao(efeito.id, modId, parametros);
          setModalModificacao(false);
        }}
        titulo="Modificações Locais do Efeito"
      />
    </>
  );
}
