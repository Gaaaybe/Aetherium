import { useMemo, useState } from 'react';
import { Modal, Badge, Card } from '../../../shared/ui';
import { useCustomItems } from '../../../shared/hooks';
import { EFEITOS, MODIFICACOES } from '../../../data';
import { calcularDetalhesPoder } from '../regras/calculadoraCusto';
import { useAcervoCalculator } from '../hooks/useAcervoCalculator';
import { ResumoPoder } from './ResumoPoder';
import type { Acervo } from '../types/acervo.types';
import type { Poder } from '../regras/calculadoraCusto';
import type { DetalhesPoder } from '../types';
import { Package, Zap, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface ResumoAcervoProps {
  isOpen: boolean;
  onClose: () => void;
  acervo: Acervo | null;
}

export function ResumoAcervo({ isOpen, onClose, acervo }: ResumoAcervoProps) {
  const { customEfeitos, customModificacoes } = useCustomItems();
  const [poderSelecionado, setPoderSelecionado] = useState<{ poder: Poder; detalhes: DetalhesPoder } | null>(null);

  // Combinar efeitos e modificações base + customizados
  const todosEfeitos = useMemo(
    () => [...EFEITOS, ...customEfeitos],
    [customEfeitos]
  );
  const todasModificacoes = useMemo(
    () => [...MODIFICACOES, ...customModificacoes],
    [customModificacoes]
  );

  // Calcular detalhes de cada poder
  const poderesComDetalhes = useMemo(() => {
    if (!acervo) return [];
    return acervo.poderes.map(poder => {
      const detalhes = calcularDetalhesPoder(poder, todosEfeitos, todasModificacoes);
      return { poder, detalhes };
    });
  }, [acervo, todosEfeitos, todasModificacoes]);

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

  if (!acervo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={acervo.nome}
      size="lg"
    >
      <div className="space-y-4">
        {/* Header com ícone e descritor */}
        <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {acervo.nome}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Descritor:</span> {acervo.descritor}
            </p>
          </div>
        </div>

        {/* Custos e Estatísticas */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Custo Total</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {detalhesAcervo.custoPdATotal} PdA
                </p>
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
            {poderesComDetalhes.map((item, index) => {
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
                      <div className="flex items-center gap-2 mb-1">
                        {isPrincipal ? (
                          <CheckCircle2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        ) : (
                          <Zap className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                        )}
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {item.poder.nome}
                        </h5>
                        {isPrincipal && (
                          <Badge variant="warning" className="flex-shrink-0">Principal</Badge>
                        )}
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
                      <Badge variant="primary">
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
