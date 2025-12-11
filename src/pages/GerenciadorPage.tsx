import { useState } from 'react';
import { Plus, Users, Trash2, Book } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import { Button } from '../shared/ui/Button';
import { EmptyState } from '../shared/ui/EmptyState';
import { ConfirmDialog } from '../shared/ui/ConfirmDialog';
import { Modal } from '../shared/ui/Modal';
import { FormCriatura } from '../features/gerenciador-criaturas/components/FormCriatura';
import { BoardCriaturas } from '../features/gerenciador-criaturas/components/BoardCriaturas';
import { BibliotecaCriaturas } from '../features/gerenciador-criaturas/components/BibliotecaCriaturas';
import { CreatureBoardProvider, useCreatureBoardContext } from '../features/gerenciador-criaturas/hooks/CreatureBoardContext';
import { UIActionsContext } from '../features/gerenciador-criaturas/hooks/UIActionsContext';
import { useBibliotecaCriaturas } from '../features/gerenciador-criaturas/hooks/useBibliotecaCriaturas';
import type { CreatureFormInput, Creature } from '../features/gerenciador-criaturas/types';

/**
 * GerenciadorContent
 * 
 * Conteúdo da página que usa o Context do board
 */
function GerenciadorContent() {
  const [showForm, setShowForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingCreature, setEditingCreature] = useState<string | null>(null);
  
  const {
    addCreature,
    addCreatureFromLibrary,
    updateCreature,
    clearBoard,
    creatures,
  } = useCreatureBoardContext();

  const { saveCreature } = useBibliotecaCriaturas();

  const totalCreatures = creatures.length;
  const activeCreatures = creatures.filter(c => !c.status || c.status === 'ativo' || c.status === 'oculto').length;
  const defeatedCreatures = creatures.filter(c => c.status === 'derrotado').length;

  const handleCreateCreature = (input: CreatureFormInput) => {
    console.log('🎯 Criatura criada:', input);
    if (editingCreature) {
      // Modo edição - passar tudo do input para recalcular corretamente
      const updates: Partial<Creature> & Partial<CreatureFormInput> = {
        name: input.name,
        level: input.level,
        role: input.role,
        notes: input.notes,
        color: input.color,
        imageUrl: input.imageUrl,
        imagePosition: input.imagePosition,
        rdOverride: input.rdOverride,
        speedOverride: input.speedOverride,
        sovereigntyMultiplier: input.sovereigntyMultiplier,
        sovereignty: input.sovereignty,
        attributeDistribution: input.attributeDistribution,
        saveDistribution: input.saveDistribution,
        selectedSkills: input.selectedSkills,
      };
      updateCreature(editingCreature, updates);
      setEditingCreature(null);
    } else {
      // Modo criação
      addCreature(input);
    }
    setShowForm(false);
  };

  const handleEditCreature = (creatureId: string) => {
    setEditingCreature(creatureId);
    setShowForm(true);
  };

  const handleClearBoard = () => {
    clearBoard();
    setShowClearConfirm(false);
  };

  const handleSaveCreature = (creatureId: string) => {
    const creature = creatures.find(c => c.id === creatureId);
    if (creature) {
      saveCreature(creature);
    }
  };

  const handleLoadCreature = (creature: Creature) => {
    addCreatureFromLibrary(creature);
  };

  return (
    <ReactFlowProvider>
      <UIActionsContext.Provider value={{ 
        onEditCreature: handleEditCreature,
        onSaveCreature: handleSaveCreature 
      }}>
        <div className="h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Gerenciador de Criaturas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sistema de gerenciamento de criaturas em tempo real
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {totalCreatures} criatura{totalCreatures !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeCreatures} ativa{activeCreatures !== 1 ? 's' : ''} • {defeatedCreatures} derrotada{defeatedCreatures !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowLibrary(true)} 
                variant="outline"
                className="gap-2"
              >
                <Book className="w-4 h-4" />
                Biblioteca
              </Button>
              {totalCreatures > 0 && (
                <Button 
                  onClick={() => setShowClearConfirm(true)} 
                  variant="outline"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar Board
                </Button>
              )}
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Criatura
              </Button>
            </div>
          </div>
        </div>

        {/* Board ou Empty State */}
        {totalCreatures === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <EmptyState
              icon={<Users className="w-12 h-12 text-espirito-500" />}
              title="Board vazio"
              description="Adicione criaturas ao board para começar a sessão."
              action={{
                label: 'Adicionar Primeira Criatura',
                onClick: () => setShowForm(true),
              }}
            />
          </div>
        ) : (
          <div className="flex-1 border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <BoardCriaturas />
          </div>
        )}

        {/* Modal de Criação/Edição */}
        <FormCriatura
          key={editingCreature || 'new'}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingCreature(null);
          }}
          onSubmit={handleCreateCreature}
          mode={editingCreature ? 'edit' : 'create'}
          initialData={
            editingCreature 
              ? (() => {
                  const creature = creatures.find(c => c.id === editingCreature);
                  if (!creature) return undefined;
                  return {
                    name: creature.name,
                    level: creature.level,
                    role: creature.role,
                    notes: creature.notes,
                    color: creature.color,
                    imageUrl: creature.imageUrl,
                    imagePosition: creature.imagePosition,
                    rdOverride: creature.stats.rd,
                    damageOverride: creature.stats.damage,
                    speedOverride: creature.stats.speed,
                    sovereigntyMultiplier: creature.role === 'ChefeSolo' ? creature.bossMechanics?.sovereigntyMax : undefined,
                    sovereignty: creature.bossMechanics?.sovereignty,
                    attributeDistribution: creature.attributeDistribution,
                    saveDistribution: creature.saveDistribution,
                    selectedSkills: creature.selectedSkills,
                  };
                })()
              : undefined
          }
        />

        {/* Dialog de Confirmação */}
        <ConfirmDialog
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={handleClearBoard}
          title="Limpar Board"
          message="Tem certeza que deseja remover todas as criaturas do board? Esta ação não pode ser desfeita."
          confirmText="Limpar"
          cancelText="Cancelar"
          variant="danger"
        />

        {/* Modal da Biblioteca */}
        <Modal
          isOpen={showLibrary}
          onClose={() => setShowLibrary(false)}
          title="Biblioteca de Criaturas"
          size="xl"
        >
          <BibliotecaCriaturas
            onLoadCreature={handleLoadCreature}
            onClose={() => setShowLibrary(false)}
          />
        </Modal>
      </div>
      </UIActionsContext.Provider>
    </ReactFlowProvider>
  );
}

/**
 * GerenciadorPage
 * 
 * Wrapper com Provider do board
 */
export function GerenciadorPage() {
  return (
    <CreatureBoardProvider>
      <GerenciadorContent />
    </CreatureBoardProvider>
  );
}
