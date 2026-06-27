import { Modal, ModalFooter, Button, Badge, Input, Textarea, Select, Slider, InlineHelp, EmptyState } from '../../../shared/ui';
import { useState, useEffect, useRef } from 'react';
import { useFavoritos } from '../../../shared/hooks';
import { useCatalog } from '@/context/useCatalog';
import { useModificacaoFilter, OrdenacaoTipo } from '../hooks/useModificacaoFilter';
import { Sparkles, AlertTriangle, Search, Star, BarChart2, RotateCcw, Settings, Edit3, FileText, DollarSign, Tag, ArrowLeft, Info } from 'lucide-react';

interface SeletorModificacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSelecionar: (modId: string, parametros?: Record<string, string | number>) => void;
  titulo?: string;
}

export function SeletorModificacao({
  isOpen,
  onClose,
  onSelecionar,
  titulo = "Selecionar Modificação"
}: SeletorModificacaoProps) {
  const { isFavoritoModificacao, toggleFavoritoModificacao } = useFavoritos();
  const { modificacoes: todasModificacoes } = useCatalog();

  const {
    busca, setBusca,
    tipoFiltro, setTipoFiltro,
    categoriaFiltro, setCategoriaFiltro,
    favoritosOnly, setFavoritosOnly,
    ordenacao, setOrdenacao,
    modificacoesFiltradas,
    categorias,
    limparFiltros
  } = useModificacaoFilter(todasModificacoes);

  const [modSelecionada, setModSelecionada] = useState<string | null>(null);
  const [parametros, setParametros] = useState<Record<string, string | number>>({});
  const [configuracaoSelecionada, setConfiguracaoSelecionada] = useState<string>('');
  
  // Ref para armazenar posição do scroll da lista
  const scrollPositionRef = useRef<number>(0);
  const listaContainerRef = useRef<HTMLDivElement>(null);

  const modBase = modSelecionada ? todasModificacoes.find(m => m.id === modSelecionada) : null;

  // Restaura a posição do scroll quando volta para a lista
  useEffect(() => {
    if (!modSelecionada && listaContainerRef.current) {
      listaContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [modSelecionada]);

  const handleSelecionarMod = (modId: string) => {
    // Salva a posição do scroll antes de selecionar
    if (listaContainerRef.current) {
      scrollPositionRef.current = listaContainerRef.current.scrollTop;
    }
    setModSelecionada(modId);
    
    // Inicializa parâmetros quando seleciona uma modificação
    const mod = todasModificacoes.find(m => m.id === modId);
    if (mod) {
      const parametrosIniciais: Record<string, string | number> = {};
      
      // Se tem grau, inicializa com o grau mínimo
      if (mod.tipoParametro === 'grau') {
        parametrosIniciais.grau = mod.grauMinimo || 1;
      }
      
      setParametros(parametrosIniciais);
    }
    setConfiguracaoSelecionada('');
  };

  const handleSelecionar = () => {
    if (!modSelecionada) return;
    
    // Se tem configuração selecionada, sempre incluir nos parâmetros
    // Se requer outros parâmetros, incluir também
    const parametrosFinal = (modBase?.requerParametros || configuracaoSelecionada) ? {
      ...parametros,
      ...(configuracaoSelecionada && { configuracaoSelecionada })
    } : undefined;
    
    onSelecionar(modSelecionada, parametrosFinal);
    
    // Reset
    setModSelecionada(null);
    setParametros({});
    setConfiguracaoSelecionada('');
    setBusca('');
    setTipoFiltro('');
    setCategoriaFiltro('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modSelecionada 
        ? `Configurar: ${modBase?.nome}` 
        : `${titulo} (${modificacoesFiltradas.length} de ${todasModificacoes.length})`
      }
      size="xl"
    >
      <div className="space-y-4">
        {!modSelecionada ? (
          <>
            {/* Dica sobre modificações */}
            <InlineHelp
              type="info"
              text="Extras aumentam o custo mas adicionam funcionalidades. Falhas reduzem o custo mas impõem limitações."
              dismissible={true}
              storageKey="modificacoes-info"
            />

            {/* Busca */}
            <Input
              placeholder="Buscar por nome, descrição ou categoria..."
              value={busca}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
            />

            {/* Controles: Ordenação e Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Ordenação */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as OrdenacaoTipo)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="nome-asc">Nome (A-Z)</option>
                  <option value="nome-desc">Nome (Z-A)</option>
                  <option value="custo-asc">Custo (menor)</option>
                  <option value="custo-desc">Custo (maior)</option>
                  <option value="categoria">Categoria</option>
                </select>
              </div>

              {/* Filtro de Tipo */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={tipoFiltro === '' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setTipoFiltro('')}
                    className="flex-1"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={tipoFiltro === 'extra' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setTipoFiltro('extra')}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Extras
                  </Button>
                  <Button
                    variant={tipoFiltro === 'falha' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setTipoFiltro('falha')}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Falhas
                  </Button>
                </div>
              </div>
              
              {/* Filtro de Favoritos */}
                <Button
                  variant={favoritosOnly ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFavoritosOnly(!favoritosOnly)}
                  fullWidth
                  className="flex items-center justify-center gap-2"
                >
                  <Star className={`w-4 h-4 ${favoritosOnly ? 'fill-current' : ''}`} /> {favoritosOnly ? 'Mostrar Todas' : 'Apenas Favoritos'}
                </Button>
              </div>

              {/* Filtro de Categoria */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todas</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

            {/* Estatísticas */}
            {(busca || tipoFiltro || categoriaFiltro) && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
                <span className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Mostrando {modificacoesFiltradas.length} de {todasModificacoes.length} modificações
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Resetar
                </Button>
              </div>
            )}


            {/* Lista de Modificações */}
            {modificacoesFiltradas.length === 0 ? (
              <EmptyState
                icon={<Search className="w-12 h-12 text-gray-400" />}
                title="Nenhuma modificação encontrada"
                description="Tente ajustar os filtros ou buscar por outros termos"
                action={{
                  label: 'Limpar Filtros',
                  onClick: limparFiltros,
                  icon: <RotateCcw className="w-4 h-4" />
                }}
              />
            ) : (
              <div ref={listaContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {modificacoesFiltradas.map((mod) => (
                  <div key={mod.id} className="relative">
                    <button
                      className={`w-full p-4 pr-12 border-2 rounded-lg transition-colors text-left group ${
                        mod.tipo === 'extra'
                          ? 'border-green-200 dark:border-green-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'border-orange-200 dark:border-orange-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      }`}
                      onClick={() => handleSelecionarMod(mod.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-espirito-700 dark:group-hover:text-espirito-300">
                            {mod.nome}
                          </h4>
                          {mod.configuracoes && (
                            <span className="text-xs" title="Tem configurações"><Settings className="w-3 h-3 text-espirito-500" /></span>
                          )}
                          {mod.requerParametros && (
                            <span className="text-xs" title="Requer parâmetros"><Edit3 className="w-3 h-3" /></span>
                          )}
                        </div>
                        <Badge variant={mod.tipo === 'extra' ? 'success' : 'warning'} size="sm" className="flex items-center gap-1">
                          {mod.tipo === 'extra' ? <Sparkles className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {mod.descricao}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {mod.custoFixo !== 0 && (
                          <span className={`font-semibold ${mod.custoFixo > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {mod.custoFixo > 0 ? '+' : ''}{mod.custoFixo} fixo
                          </span>
                        )}
                        {mod.custoPorGrau !== 0 && (
                          <span className={`font-semibold ${mod.custoPorGrau > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {mod.custoPorGrau > 0 ? '+' : ''}{mod.custoPorGrau}/grau
                          </span>
                        )}
                      </div>
                    </button>
                    
                    {/* Botão de favoritar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoritoModificacao(mod.id);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title={isFavoritoModificacao(mod.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      aria-label={isFavoritoModificacao(mod.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Star className={`w-5 h-5 ${isFavoritoModificacao(mod.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Detalhes da Modificação Selecionada */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {modBase?.nome}
                  </h3>
                  <Badge variant={modBase?.tipo === 'extra' ? 'success' : 'warning'} size="sm" className="flex items-center gap-1">
                    {modBase?.tipo === 'extra' ? <><Sparkles className="w-3 h-3" /> Extra</> : <><AlertTriangle className="w-3 h-3" /> Falha</>}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setModSelecionada(null);
                    setConfiguracaoSelecionada('');
                    setParametros({});
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>
              </div>

              {/* Card de Informações Principais */}
              <div className={`p-4 rounded-lg border-2 ${
                modBase?.tipo === 'extra'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}>
                <div className="space-y-3">
                  {/* Descrição */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Descrição:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {modBase?.descricao}
                    </p>
                  </div>

                  {/* Informações de Custo e Categoria */}
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> CUSTO:
                      </span>
                      <div className="flex gap-2">
                        {modBase?.custoFixo !== 0 && (
                          <span className={`text-sm font-bold ${modBase!.custoFixo > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {modBase!.custoFixo > 0 ? '+' : ''}{modBase?.custoFixo} fixo
                          </span>
                        )}
                        {modBase?.custoPorGrau !== 0 && (
                          <span className={`text-sm font-bold ${modBase!.custoPorGrau > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {modBase!.custoPorGrau > 0 ? '+' : ''}{modBase?.custoPorGrau}/grau
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> CATEGORIA:
                      </span>
                      <Badge variant="secondary" size="sm">
                        {modBase?.categoria}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seletor de Configuração */}
              {modBase?.configuracoes && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                        Esta modificação possui variações
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                        Escolha uma das opções abaixo:
                      </p>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {modBase.configuracoes.opcoes.map((config) => {
                          // Calcula custo fixo (se a config tiver modificadorCustoFixo)
                          const custoFixoTotal = (modBase.custoFixo || 0) + (config.modificadorCustoFixo || 0);
                          // Calcula custo por grau (se a config tiver modificadorCusto)
                          const custoPorGrauTotal = (modBase.custoPorGrau || 0) + (config.modificadorCusto || 0);
                          
                          return (
                            <button
                              key={config.id}
                              className={`p-3 border-2 rounded-lg transition-all text-left ${
                                configuracaoSelecionada === config.id
                                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                              }`}
                              onClick={() => setConfiguracaoSelecionada(config.id)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {config.nome}
                                </span>
                                <div className="flex gap-2 text-xs">
                                  {custoFixoTotal !== 0 && (
                                    <span className={`font-semibold ${custoFixoTotal > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                      {custoFixoTotal > 0 ? '+' : ''}{custoFixoTotal} fixo
                                    </span>
                                  )}
                                  {custoPorGrauTotal !== 0 && (
                                    <span className={`font-semibold ${custoPorGrauTotal > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                      {custoPorGrauTotal > 0 ? '+' : ''}{custoPorGrauTotal}/grau
                                    </span>
                                  )}
                                </div>
                              </div>
                              {config.descricao && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {config.descricao}
                                </p>
                              )}
                              {config.grauMinimo && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Grau mínimo: {config.grauMinimo}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modBase?.requerParametros && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Esta modificação requer informações adicionais:
                  </p>

                  {modBase.tipoParametro === 'grau' && (
                    <div className="space-y-2">
                      <Slider
                        label="Grau da Modificação"
                        value={Number(parametros.grau) || modBase.grauMinimo || 1}
                        onChange={(valor) => setParametros({ ...parametros, grau: valor })}
                        min={modBase.grauMinimo || 1}
                        max={modBase.grauMaximo || 20}
                        step={1}
                        showValue={true}
                      />
                      {modBase.detalhesGrau && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex items-start gap-2">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" /> {modBase.detalhesGrau}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Custo: <span className="font-bold text-espirito-600 dark:text-espirito-400">
                          +{modBase.custoPorGrau} por Grau × {Number(parametros.grau) || modBase.grauMinimo || 1} = 
                          +{modBase.custoPorGrau * (Number(parametros.grau) || modBase.grauMinimo || 1)} PdA/Grau do Efeito
                        </span>
                      </p>
                    </div>
                  )}

                  {modBase.tipoParametro === 'texto' && (
                    <Textarea
                      label="Descrição/Detalhe"
                      placeholder={modBase.placeholder || 'Digite aqui...'}
                      value={parametros.descricao || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setParametros({ ...parametros, descricao: e.target.value })}
                      rows={3}
                    />
                  )}

                  {modBase.tipoParametro === 'numero' && (
                    <Input
                      type="number"
                      label="Valor"
                      placeholder={modBase.placeholder || 'Digite um número...'}
                      value={parametros.valor || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParametros({ ...parametros, valor: e.target.value })}
                    />
                  )}

                  {modBase.tipoParametro === 'select' && modBase.opcoes && (
                    <Select
                      label="Opção"
                      value={parametros.opcao || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setParametros({ ...parametros, opcao: e.target.value })}
                      options={modBase.opcoes.map(op => ({ value: op, label: op }))}
                    />
                  )}
                </div>
              )}

              {/* Resumo do que será adicionado */}
              {(configuracaoSelecionada || Object.keys(parametros).length > 0) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Resumo da Modificação:
                  </p>
                  <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      <strong>{modBase?.nome}</strong>
                      {configuracaoSelecionada && (
                        <> • {modBase?.configuracoes?.opcoes.find(c => c.id === configuracaoSelecionada)?.nome}</>
                      )}
                    </p>
                    {parametros.grau && (
                      <p>Grau: <strong>{parametros.grau}</strong></p>
                    )}
                    {parametros.descricao && (
                      <p>Descrição: <strong>{parametros.descricao}</strong></p>
                    )}
                    {parametros.valor && (
                      <p>Valor: <strong>{parametros.valor}</strong></p>
                    )}
                    {parametros.opcao && (
                      <p>Opção: <strong>{parametros.opcao}</strong></p>
                    )}
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={handleSelecionar}
                disabled={
                  (modBase?.configuracoes && !configuracaoSelecionada) ||
                  (modBase?.requerParametros && Object.keys(parametros).length === 0 && !configuracaoSelecionada)
                }
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Adicionar Modificação
              </Button>
              
              {modBase?.configuracoes && !configuracaoSelecionada && (
                <p className="text-sm text-orange-600 dark:text-orange-400 text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Selecione uma configuração para continuar
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
