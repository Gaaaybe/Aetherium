import { Modal, ModalFooter, Button, Badge, Input, EmptyState } from '../../../shared/ui';
import { EFEITOS } from '../../../data';
import { useState, useMemo } from 'react';
import { useFavoritos, useCustomItems } from '../../../shared/hooks';
import { FormEfeitoCustomizado } from './FormEfeitoCustomizado';
import type { Efeito } from '../../../data';

interface SeletorEfeitoProps {
  isOpen: boolean;
  onClose: () => void;
  onAdicionar: (efeitoId: string) => void;
}

type OrdenacaoTipo = 'nome-asc' | 'nome-desc' | 'custo-asc' | 'custo-desc' | 'relevancia';
type FiltroCustomTipo = 'todos' | 'com-config' | 'com-input' | 'sem-extras' | 'favoritos';

export function SeletorEfeito({ isOpen, onClose, onAdicionar }: SeletorEfeitoProps) {
  const { isFavoritoEfeito, toggleFavoritoEfeito } = useFavoritos();
  const { customEfeitos, addCustomEfeito } = useCustomItems();
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>('relevancia');
  const [filtroCustom, setFiltroCustom] = useState<FiltroCustomTipo>('todos');
  const [custoMinimo, setCustoMinimo] = useState<number>(0);
  const [custoMaximo, setCustoMaximo] = useState<number>(20);
  const [showFormCustom, setShowFormCustom] = useState(false);

  // Combina efeitos base com customizados
  const todosEfeitos = useMemo(
    () => [...EFEITOS, ...customEfeitos],
    [customEfeitos]
  );

  const efeitosFiltrados = useMemo(() => {
    const resultado = todosEfeitos.filter(efeito => {
      // Busca por nome, descrição ou exemplos
      const matchBusca = busca === '' || 
                         efeito.nome.toLowerCase().includes(busca.toLowerCase()) ||
                         efeito.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                         (efeito.exemplos?.toLowerCase().includes(busca.toLowerCase()) ?? false);
      
      // Filtro de categoria
      const matchCategoria = !categoriaFiltro || efeito.categorias.includes(categoriaFiltro);
      
      // Filtro de custo
      const matchCusto = efeito.custoBase >= custoMinimo && efeito.custoBase <= custoMaximo;
      
      // Filtros customizados
      let matchCustom = true;
      if (filtroCustom === 'com-config') {
        matchCustom = !!efeito.configuracoes;
      } else if (filtroCustom === 'com-input') {
        matchCustom = !!efeito.requerInput;
      } else if (filtroCustom === 'sem-extras') {
        matchCustom = !efeito.configuracoes && !efeito.requerInput;
      } else if (filtroCustom === 'favoritos') {
        matchCustom = isFavoritoEfeito(efeito.id);
      }
      
      return matchBusca && matchCategoria && matchCusto && matchCustom;
    });

    // Ordenação
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case 'nome-asc':
          return a.nome.localeCompare(b.nome);
        case 'nome-desc':
          return b.nome.localeCompare(a.nome);
        case 'custo-asc':
          return a.custoBase - b.custoBase;
        case 'custo-desc':
          return b.custoBase - a.custoBase;
        case 'relevancia':
        default:
          // Ordenação por relevância: se há busca, prioriza match no nome
          if (busca) {
            const aMatchNome = a.nome.toLowerCase().includes(busca.toLowerCase()) ? 1 : 0;
            const bMatchNome = b.nome.toLowerCase().includes(busca.toLowerCase()) ? 1 : 0;
            if (aMatchNome !== bMatchNome) return bMatchNome - aMatchNome;
          }
          // Depois por nome alfabético
          return a.nome.localeCompare(b.nome);
      }
    });

    return resultado;
  }, [todosEfeitos, busca, categoriaFiltro, ordenacao, filtroCustom, custoMinimo, custoMaximo, isFavoritoEfeito]);

  // Extrai todas as categorias únicas, ordenadas alfabeticamente
  const categorias = useMemo(() => 
    Array.from(new Set(EFEITOS.flatMap(e => e.categorias))).sort(),
    []
  );

  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('');
    setOrdenacao('relevancia');
    setFiltroCustom('todos');
    setCustoMinimo(0);
    setCustoMaximo(20);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Selecionar Efeito (${efeitosFiltrados.length} de ${EFEITOS.length})`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Busca */}
        <Input
          placeholder="Buscar por nome, descrição ou exemplos..."
          value={busca}
          onChange={(e: any) => setBusca(e.target.value)}
        />

        {/* Controles de Ordenação e Filtros Avançados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Ordenação */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ordenar por
            </label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as OrdenacaoTipo)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="relevancia">Relevância</option>
              <option value="nome-asc">Nome (A-Z)</option>
              <option value="nome-desc">Nome (Z-A)</option>
              <option value="custo-asc">Custo (Menor)</option>
              <option value="custo-desc">Custo (Maior)</option>
            </select>
          </div>

          {/* Filtro de Custo Mínimo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custo Mínimo
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={custoMinimo}
              onChange={(e) => setCustoMinimo(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>

          {/* Filtro de Custo Máximo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custo Máximo
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={custoMaximo}
              onChange={(e) => setCustoMaximo(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
        </div>

        {/* Filtros Customizados */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Efeito
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filtroCustom === 'todos' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCustom('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filtroCustom === 'favoritos' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCustom('favoritos')}
            >
              ⭐ Favoritos
            </Button>
            <Button
              variant={filtroCustom === 'com-config' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCustom('com-config')}
            >
              ⚙️ Com Configurações
            </Button>
            <Button
              variant={filtroCustom === 'com-input' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCustom('com-input')}
            >
              📝 Requer Input
            </Button>
            <Button
              variant={filtroCustom === 'sem-extras' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCustom('sem-extras')}
            >
              ⚡ Simples
            </Button>
          </div>
        </div>

        {/* Filtro de Categoria */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categoria
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            <Button
              variant={categoriaFiltro === '' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCategoriaFiltro('')}
            >
              Todas
            </Button>
            {categorias.map(cat => (
              <Button
                key={cat}
                variant={categoriaFiltro === cat ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCategoriaFiltro(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Efeitos */}
        {efeitosFiltrados.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Nenhum efeito encontrado"
            description={busca 
              ? `Nenhum efeito corresponde à busca "${busca}".`
              : categoriaFiltro 
              ? `Nenhum efeito na categoria "${categoriaFiltro}".`
              : 'Tente ajustar os filtros.'
            }
            action={{
              label: 'Limpar Filtros',
              onClick: limparFiltros,
              icon: '✕'
            }}
          />
        ) : (
          <div>
            {/* Estatísticas */}
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-sm">
                <div className="flex gap-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    📊 <strong className="text-gray-900 dark:text-gray-100">{efeitosFiltrados.length}</strong> efeitos encontrados
                  </span>
                  {categoriaFiltro && (
                    <span className="text-gray-600 dark:text-gray-400">
                      🏷️ Categoria: <strong className="text-espirito-600 dark:text-espirito-400">{categoriaFiltro}</strong>
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                >
                  🔄 Resetar
                </Button>
              </div>
            </div>

            {/* Grid de Efeitos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
              {efeitosFiltrados.map((efeito) => (
                <div key={efeito.id} className="relative">
                  <button
                    className="w-full p-4 pr-12 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-espirito-500 hover:bg-espirito-50 dark:hover:bg-espirito-900/20 transition-colors text-left group"
                    onClick={() => onAdicionar(efeito.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-espirito-700 dark:group-hover:text-espirito-300">
                          {efeito.nome}
                        </h4>
                        {efeito.configuracoes && (
                          <span className="text-xs" title="Tem configurações">⚙️</span>
                        )}
                        {efeito.requerInput && (
                          <span className="text-xs" title="Requer input">📝</span>
                        )}
                      </div>
                    <Badge variant="espirito" size="sm">
                      {efeito.custoBase} PdA/grau
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {efeito.descricao}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {efeito.categorias.map(cat => (
                      <span 
                        key={cat}
                        className={`text-xs px-2 py-0.5 rounded ${
                          cat === categoriaFiltro 
                            ? 'bg-espirito-100 dark:bg-espirito-900 text-espirito-700 dark:text-espirito-300 font-semibold'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  
                  {efeito.exemplos && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2">
                      💡 {efeito.exemplos}
                    </p>
                  )}
                </button>
                
                {/* Botão de favoritar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoritoEfeito(efeito.id);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={isFavoritoEfeito(efeito.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  aria-label={isFavoritoEfeito(efeito.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <span className="text-xl">
                    {isFavoritoEfeito(efeito.id) ? '⭐' : '☆'}
                  </span>
                </button>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={() => setShowFormCustom(true)}>
          + Criar Efeito Customizado
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>

      {/* Modal de criação de efeito customizado */}
      <FormEfeitoCustomizado
        isOpen={showFormCustom}
        onClose={() => setShowFormCustom(false)}
        onSave={(efeito) => {
          addCustomEfeito(efeito);
          setShowFormCustom(false);
        }}
      />
    </Modal>
  );
}
