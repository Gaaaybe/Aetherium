import { useMemo, useState } from 'react';
import { Modal, Badge, Card, DynamicIcon, Button, toast } from '../../../shared/ui';
import { useCatalog } from '@/context/useCatalog';
import { calcularDetalhesPoder } from '../regras/calculadoraCusto';
import { useAcervoCalculator } from '../hooks/useAcervoCalculator';
import { ResumoPoder } from './ResumoPoder';
import type { Acervo } from '../types/acervo.types';
import type { Poder } from '../regras/calculadoraCusto';
import type { DetalhesPoder } from '../types';
import { Zap, AlertTriangle, Sparkles, Copy, BookOpen } from 'lucide-react';
import { getThemeByDomain, PatternOverlay } from '../../../shared/utils/summary-themes';

interface ResumoAcervoProps {
  isOpen: boolean;
  onClose: () => void;
  acervo: Acervo | null;
}

export function ResumoAcervo({ isOpen, onClose, acervo }: ResumoAcervoProps) {
  const { efeitos: efeitosBase, modificacoes: modificacoesBase } = useCatalog();
  const [poderSelecionado, setPoderSelecionado] = useState<{ poder: Poder; detalhes: DetalhesPoder } | null>(null);

  // Calcular detalhes de cada poder
  const poderesComDetalhes = useMemo(() => {
    if (!acervo) return [];
    return acervo.poderes.map(poder => {
      const detalhes = calcularDetalhesPoder(poder, efeitosBase, modificacoesBase);
      return { poder, detalhes };
    });
  }, [acervo, efeitosBase, modificacoesBase]);

  // Calcular detalhes do acervo
  const detalhesAcervo = useAcervoCalculator(
    acervo || {
      id: '',
      nome: '',
      descritor: '',
      poderes: [],
      dataCriacao: '',
      dataModificacao: '',
    },
    poderesComDetalhes
  );

  const handleCopiarResumo = () => {
    if (!acervo) return;
    
    const poderesTexto = poderesComDetalhes.map((p: { poder: Poder; detalhes: DetalhesPoder }) => 
      `- ${p.poder.nome} (${p.detalhes.custoPdATotal} PdA${p.detalhes.peTotal > 0 ? ` | ${p.detalhes.peTotal} PE` : ''})`
    ).join('\n');

    const texto = `📜 Acervo: ${acervo.nome}\n` +
      `Descritor: ${acervo.descritor}\n` +
      `--------------------------\n` +
      `Custo Total: ${detalhesAcervo.custoPdATotal} PdA${detalhesAcervo.peTotal > 0 ? ` | ${detalhesAcervo.peTotal} PE` : ''}\n` +
      `Espaços: ${detalhesAcervo.espacosTotal}\n` +
      `Poderes (${detalhesAcervo.quantidadePoderes}):\n${poderesTexto}`;

    navigator.clipboard.writeText(texto);
    toast.success('Resumo copiado para a área de transferência!');
  };

  if (!acervo) return null;

  // Tentar pegar o tema do primeiro poder para o acervo
  const primeiroPoder = acervo.poderes[0];
  const theme = getThemeByDomain(primeiroPoder?.dominioId || 'peculiar');
  const IconWatermark = theme.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-4">
        {/* Header Premium Dinâmico */}
        <div className={`relative -mt-6 -mx-6 p-6 bg-gradient-to-br ${theme.bgGradient} ${theme.textColor} rounded-t-lg overflow-hidden transition-colors duration-500`}>
          {/* Padrão decorativo dinâmico */}
          <PatternOverlay pattern={theme.pattern} />
          
          {/* Ícone Watermark Gigante */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none">
            <IconWatermark className="w-64 h-64 transform rotate-12" />
          </div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/20 border border-white/30 flex items-center justify-center flex-shrink-0 shadow-md">
              {acervo.icone ? (
                <DynamicIcon name={acervo.icone} className="w-14 h-14" />
              ) : (
                <BookOpen className="w-10 h-10" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-2xl font-bold truncate drop-shadow-sm">
                  {acervo.nome}
                </h3>
              </div>
              <p className="text-sm opacity-90 leading-relaxed italic line-clamp-2">
                "{acervo.descritor}"
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] font-bold uppercase tracking-wider">Acervo</Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 flex items-center gap-1">
                   {theme.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopiarResumo}
                  className="ml-auto h-7 px-2 text-[10px] text-white hover:bg-white/20 border-none"
                >
                  <Copy className="w-3 h-3 mr-1" /> Copiar Resumo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Removido o header antigo que foi substituído pelo premium acima */}

        {/* Custos e Estatísticas */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Custo Total</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-2xl font-bold ${theme.accentColor.replace('text-', 'text-')}`}>
                    {detalhesAcervo.custoPdATotal} PdA
                  </p>
                  {detalhesAcervo.peTotal > 0 && (
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      • {detalhesAcervo.peTotal} PE
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {detalhesAcervo.custoPdAPrincipal} (principal) + {detalhesAcervo.custoPdAOutros} (outros)
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Espaços Totais</p>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {detalhesAcervo.espacosTotal}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {detalhesAcervo.quantidadePoderes} {detalhesAcervo.quantidadePoderes === 1 ? 'poder' : 'poderes'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Regras do Acervo */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Regras do Acervo
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Apenas 1 poder pode estar ativo por vez</li>
                  <li>• Trocar de poder = ação livre (máximo 1x por turno)</li>
                  <li>• Todos os poderes compartilham vulnerabilidades</li>
                  <li>• Nenhum poder pode ter Duração Permanente</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Poderes */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Poderes no Acervo
          </h4>
          <div className="space-y-2">
            {poderesComDetalhes.map((item: { poder: Poder; detalhes: DetalhesPoder }, index: number) => {
              const isPrincipal = index === detalhesAcervo.poderPrincipalIndex;
              
              return (
                <Card 
                  key={item.poder.id}
                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                    isPrincipal 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' 
                      : 'bg-white dark:bg-gray-800'
                  }`}
                  onClick={() => setPoderSelecionado(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600 group-hover:scale-105 transition-transform">
                          {item.poder.icone ? (
                            <DynamicIcon name={item.poder.icone} className="w-8 h-8 text-purple-600 dark:text-purple-300" />
                          ) : (
                            <Zap className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h5 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                            {item.poder.nome}
                          </h5>
                          {isPrincipal && (
                            <div className="flex items-center gap-1">
                              <Badge variant="warning" className="text-[10px] h-4 px-1.5 font-bold">Principal</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.poder.descricao && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {item.poder.descricao}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.poder.efeitos.length} {item.poder.efeitos.length === 1 ? 'efeito' : 'efeitos'}
                        </span>
                        {item.poder.modificacoesGlobais.length > 0 && (
                          <span className="text-purple-600 dark:text-purple-400">
                            • {item.poder.modificacoesGlobais.length} modificações
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="default">
                        {item.detalhes.custoPdATotal} PdA
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.detalhes.espacosTotal} espaços
                      </span>
                    </div>
                  </div>
                  
                  {/* Aviso se permanente */}
                  {item.poder.duracao === 5 && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300">
                        Duração Permanente não é permitida em acervos
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer com datas */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Criado: {new Date(acervo.dataCriacao).toLocaleDateString('pt-BR')}</span>
            <span>Modificado: {new Date(acervo.dataModificacao).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Modal ResumoPoder aninhado */}
      {poderSelecionado && (
        <ResumoPoder
          isOpen={!!poderSelecionado}
          onClose={() => setPoderSelecionado(null)}
          poder={poderSelecionado.poder}
          detalhes={poderSelecionado.detalhes}
        />
      )}
    </Modal>
  );
}
