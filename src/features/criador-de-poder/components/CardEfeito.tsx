import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Button, Slider, Select, Input } from '../../../shared/ui';
import { MODIFICACOES, buscarGrauNaTabela } from '../../../data';
import { useState } from 'react';
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
}

export function CardEfeito({
  efeitoDetalhado,
  onRemover,
  onAtualizarGrau,
  onAdicionarModificacao,
  onRemoverModificacao,
  onAtualizarInputCustomizado,
  onAtualizarConfiguracao,
}: CardEfeitoProps) {
  const { efeito, efeitoBase, custoPorGrau, custoFixo, custoTotal } = efeitoDetalhado;
  const [modalModificacao, setModalModificacao] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Proteção contra dados inválidos
  if (!efeito || !efeitoBase) {
    console.error('Dados do efeito inválidos:', efeitoDetalhado);
    return null;
  }
  
  const dadosGrau = buscarGrauNaTabela(efeito.grau);

  return (
    <>
      <Card hover>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform duration-200"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  title={isExpanded ? 'Recolher' : 'Expandir'}
                >
                  ▶
                </button>
                <div className="flex-1">
                  <CardTitle>{efeitoBase.nome}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Grau {efeito.grau} • {efeito.inputCustomizado && `${efeito.inputCustomizado} • `}
                    {custoPorGrau} PdA/grau
                  </p>
                  
                  {/* Configuração selecionada quando colapsado */}
                  {!isExpanded && efeito.configuracaoSelecionada && efeitoBase.configuracoes && (
                    <div className="mt-1">
                      <Badge variant="secondary" size="sm">
                        ⚙️ {efeitoBase.configuracoes.opcoes.find((c: any) => c.id === efeito.configuracaoSelecionada)?.nome}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Modificações quando colapsado */}
                  {!isExpanded && efeito.modificacoesLocais.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {efeito.modificacoesLocais.map((mod: any) => {
                        const modBase = MODIFICACOES.find(m => m.id === mod.modificacaoBaseId);
                        return (
                          <Badge 
                            key={mod.id}
                            variant={modBase?.tipo === 'extra' ? 'success' : 'warning'}
                            size="sm"
                            title={modBase?.descricao}
                          >
                            {modBase?.tipo === 'extra' ? '✨' : '⚠️'} {modBase?.nome || mod.modificacaoBaseId}
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
              <Badge variant="espirito" size="lg">
                {custoTotal} PdA
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemover(efeito.id)}
                className="text-red-600 hover:text-red-700"
              >
                🗑️ Remover
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
            min={1}
            max={20}
            showValue
            onChange={(valor: number) => onAtualizarGrau(efeito.id, valor)}
          />

          {/* Informações da Tabela Universal */}
          {dadosGrau && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              {/* Campos Principais - Sempre Visíveis */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">💥 Dano/Cura</p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.dano}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">📏 Distância</p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.distancia}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">⚡ PE</p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.pe}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">📦 Espaços</p>
                  <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.espacos}</p>
                </div>
              </div>

              {/* Botão para Expandir/Colapsar */}
              <button
                onClick={() => {
                  const detalhes = document.getElementById(`detalhes-tabela-${efeito.id}`);
                  const icone = document.getElementById(`icone-toggle-${efeito.id}`);
                  if (detalhes && icone) {
                    detalhes.classList.toggle('hidden');
                    icone.textContent = detalhes.classList.contains('hidden') ? '▼' : '▲';
                  }
                }}
                className="w-full mt-3 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <span id={`icone-toggle-${efeito.id}`}>▼</span>
                <span>Mais detalhes da Tabela Universal</span>
              </button>

              {/* Campos Adicionais - Colapsáveis */}
              <div id={`detalhes-tabela-${efeito.id}`} className="hidden mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">⚖️ Massa</p>
                    <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.massa}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">⏱️ Tempo</p>
                    <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.tempo}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">🚀 Velocidade</p>
                    <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.velocidade}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">🏃 Deslocamento</p>
                    <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.deslocamento}</p>
                  </div>
                </div>
              </div>
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
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                ⚠️ Este efeito requer especificação
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
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                ⚙️ Configuração que altera o custo base
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
                  const modBase = MODIFICACOES.find(m => m.id === mod.modificacaoBaseId);
                  return (
                    <Badge 
                      key={mod.id}
                      variant={modBase?.tipo === 'extra' ? 'success' : 'warning'}
                      className="flex items-center gap-2"
                    >
                      {modBase?.nome || mod.modificacaoBaseId}
                      {mod.grauModificacao && (
                        <span className="text-xs font-bold">Grau {mod.grauModificacao}</span>
                      )}
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
                        ✕
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
          >
            + Adicionar Modificação
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
