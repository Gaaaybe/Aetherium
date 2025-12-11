import { useState, useMemo } from 'react';
import { Book, Search, Filter, Download, Upload, Copy, Trash2, Plus, X } from 'lucide-react';
import { Card, Button, Input, Select, EmptyState, Badge, ConfirmDialog } from '../../../shared/ui';
import { useBibliotecaCriaturas } from '../hooks/useBibliotecaCriaturas';
import { getAllRoles } from '../data/roleTemplates';
import type { Creature, CreatureRole } from '../types';

interface BibliotecaCriaturasProps {
  onLoadCreature: (creature: Creature) => void;
  onClose: () => void;
}

/**
 * BibliotecaCriaturas
 * 
 * Componente para gerenciar biblioteca de criaturas salvas.
 * Permite buscar, filtrar, carregar e exportar criaturas.
 */
export function BibliotecaCriaturas({ onLoadCreature, onClose }: BibliotecaCriaturasProps) {
  const {
    savedCreatures,
    isLoading,
    removeCreature,
    loadCreature,
    duplicateCreature,
    searchCreatures,
    filterByRole,
    sortCreatures,
    exportLibrary,
    importLibrary,
  } = useBibliotecaCriaturas();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<CreatureRole | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'role' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Aplicar filtros e ordenação
  const filteredCreatures = useMemo(() => {
    let result = savedCreatures;

    // Busca
    if (searchQuery) {
      result = searchCreatures(searchQuery);
    }

    // Filtro por role
    if (roleFilter) {
      result = filterByRole(roleFilter);
    }

    // Ordenação
    result = sortCreatures(result, sortBy, sortOrder);

    return result;
  }, [savedCreatures, searchQuery, roleFilter, sortBy, sortOrder, searchCreatures, filterByRole, sortCreatures]);

  // Handler: Carregar criatura no board
  const handleLoad = (id: string) => {
    const creature = loadCreature(id);
    if (creature) {
      onLoadCreature(creature);
      onClose();
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      removeCreature(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Handler: Importar arquivo
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importLibrary(file)
      .then(() => {
        alert('Biblioteca importada com sucesso!');
      })
      .catch((error) => {
        alert(`Erro ao importar: ${error.message}`);
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Carregando biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-espirito-600 dark:text-espirito-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Biblioteca de Criaturas
          </h2>
          <Badge variant="espirito">{savedCreatures.length}</Badge>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, função ou notas..."
            className="pl-10"
          />
        </div>

        {/* Filtros e Ações */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={roleFilter || ''}
            onChange={(e) => setRoleFilter((e.target.value || null) as CreatureRole | null)}
            className="flex-1 min-w-[150px]"
          >
            <option value="">Todas as Funções</option>
            {getAllRoles().map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'level' | 'role' | 'date')}
            className="flex-1 min-w-[120px]"
          >
            <option value="name">Nome</option>
            <option value="level">Nível</option>
            <option value="role">Função</option>
            <option value="date">Data</option>
          </Select>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                     rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          >
            <Filter className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          <button
            onClick={exportLibrary}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                     rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Exportar biblioteca"
          >
            <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          <label className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                          rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Lista de Criaturas */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCreatures.length === 0 ? (
          <EmptyState
            icon={<Book className="w-16 h-16 text-gray-400 dark:text-gray-600" />}
            title={searchQuery || roleFilter ? "Nenhuma criatura encontrada" : "Biblioteca vazia"}
            description={searchQuery || roleFilter ? "Tente ajustar os filtros de busca" : "Salve criaturas do board para vê-las aqui"}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCreatures.map((creature) => (
              <CreatureLibraryCard
                key={creature.id}
                creature={creature}
                onLoad={() => handleLoad(creature.id)}
                onDuplicate={() => duplicateCreature(creature.id)}
                onDelete={() => {
                  setDeleteTarget({ id: creature.id, name: creature.name });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remover da Biblioteca"
        message={deleteTarget ? `Tem certeza que deseja remover "${deleteTarget.name}" da biblioteca? Esta ação não pode ser desfeita.` : ''}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}

// Card individual da criatura
interface CreatureLibraryCardProps {
  creature: Creature;
  onLoad: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function CreatureLibraryCard({ creature, onLoad, onDuplicate, onDelete }: CreatureLibraryCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagem */}
      {creature.imageUrl && (
        <div className="relative h-32 overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            src={creature.imageUrl}
            alt={creature.name}
            className="w-full h-full object-cover"
            style={creature.imagePosition ? {
              objectPosition: `${creature.imagePosition.x}% ${creature.imagePosition.y}%`
            } : undefined}
          />
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate text-gray-900 dark:text-gray-100">{creature.name}</h3>
        
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <span>Nível {creature.level}</span>
          <span>•</span>
          <span>{creature.role}</span>
        </div>

        {creature.notes && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {creature.notes}
          </p>
        )}

        {/* Stats resumidos */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="text-center p-1 bg-gray-100 dark:bg-gray-800 rounded">
            <p className="text-gray-500 dark:text-gray-400">PV</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">{creature.stats.maxHp}</p>
          </div>
          <div className="text-center p-1 bg-gray-100 dark:bg-gray-800 rounded">
            <p className="text-gray-500 dark:text-gray-400">PE</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">{creature.stats.maxPe}</p>
          </div>
          <div className="text-center p-1 bg-gray-100 dark:bg-gray-800 rounded">
            <p className="text-gray-500 dark:text-gray-400">RD</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">{creature.stats.rd}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={onLoad}
            variant="primary"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Carregar
          </Button>
          <button
            onClick={onDuplicate}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Remover"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </Card>
  );
}
