import { useState } from 'react';
import { Modal, ModalFooter, Button, Slider } from '../../../shared/ui';
import { Sparkles, Library, Plus, Zap, Clock, Ruler, Timer } from 'lucide-react';
import type { CreatureAbility } from '../types';
import type { Poder } from '../../criador-de-poder/types';
import { BibliotecaPoderesModal } from './BibliotecaPoderesModal';
import { CriadorDePoderModal } from './CriadorDePoderModal';
import { getNomeEscala } from '../utils/escalasHelper';

interface FormHabilidadeProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ability: Omit<CreatureAbility, 'id'>) => void;
  initialData?: CreatureAbility;
  mode?: 'create' | 'edit';
  effortUnitValue: number; // Valor da unidade de esforço da criatura
}

export function FormHabilidade({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  mode = 'create',
  effortUnitValue 
}: FormHabilidadeProps) {
  const [selectedPoder, setSelectedPoder] = useState<Poder | null>((initialData?.poder as Poder) || null);
  const [effortCost, setEffortCost] = useState<0 | 1 | 2 | 3>(initialData?.effortCost || 1);
  const [showPoderLibrary, setShowPoderLibrary] = useState(false);
  const [showPoderCreator, setShowPoderCreator] = useState(false);

  const handleSubmit = () => {
    if (!selectedPoder) return;
    
    onSubmit({
      name: selectedPoder.nome,
      poder: selectedPoder,
      effortCost,
    });
    onClose();
    
    // Reset
    setSelectedPoder(null);
    setEffortCost(1);
  };

  const realPeCost = effortCost * effortUnitValue;
  const isValid = selectedPoder !== null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'create' ? 'Adicionar Habilidade' : 'Editar Habilidade'}
        size="lg"
      >
        <div className="space-y-6 py-4">
          {/* Seleção de Poder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Poder Base
            </label>
            
            {selectedPoder ? (
              <div className="p-4 bg-espirito-50 dark:bg-espirito-900/20 border-2 border-espirito-300 dark:border-espirito-700 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-espirito-600 dark:text-espirito-400" />
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {selectedPoder.nome}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPoder(null)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Alterar
                  </button>
                </div>
                
                {selectedPoder.descricao && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {selectedPoder.descricao}
                  </p>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Efeitos:</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedPoder.efeitos.length}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Ação:</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getNomeEscala('acao', selectedPoder.acao)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
                      <Ruler className="w-3 h-3" />
                      <span>Alcance:</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getNomeEscala('alcance', selectedPoder.alcance)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 col-span-3">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
                      <Timer className="w-3 h-3" />
                      <span>Duração:</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getNomeEscala('duracao', selectedPoder.duracao)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowPoderLibrary(true)}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-espirito-500 dark:hover:border-espirito-400 hover:bg-espirito-50 dark:hover:bg-espirito-900/20 transition-colors group"
                >
                  <Library className="w-5 h-5 text-gray-400 group-hover:text-espirito-600 dark:group-hover:text-espirito-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-espirito-700 dark:group-hover:text-espirito-300">
                    Escolher da Biblioteca
                  </span>
                </button>
                
                <button
                  onClick={() => setShowPoderCreator(true)}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-caos-500 dark:hover:border-caos-400 hover:bg-caos-50 dark:hover:bg-caos-900/20 transition-colors group"
                >
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-caos-600 dark:group-hover:text-caos-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-caos-700 dark:group-hover:text-caos-300">
                    Criar Novo Poder
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Custo em Unidades de Esforço */}
          {selectedPoder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custo em Unidades de Esforço
              </label>
              
              <div className="space-y-3">
                <Slider
                  value={effortCost}
                  onChange={(value) => setEffortCost(value as 0 | 1 | 2 | 3)}
                  min={0}
                  max={3}
                  step={1}
                  showValue
                  label={`${effortCost} ${effortCost === 1 ? 'unidade' : 'unidades'}`}
                />
                
                {/* Preview do Custo Real */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Custo Real em PE:
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {realPeCost}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({effortCost} × {effortUnitValue})
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Cada unidade de esforço custa {effortUnitValue} PE para esta criatura
                </p>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal da Biblioteca de Poderes */}
      <BibliotecaPoderesModal
        isOpen={showPoderLibrary}
        onClose={() => setShowPoderLibrary(false)}
        onSelectPoder={(poder) => {
          setSelectedPoder(poder);
          setShowPoderLibrary(false);
        }}
      />

      {/* Modal do Criador de Poderes */}
      <CriadorDePoderModal
        isOpen={showPoderCreator}
        onClose={() => setShowPoderCreator(false)}
        onPoderCriado={(poder) => {
          setSelectedPoder(poder);
          setShowPoderCreator(false);
        }}
      />
    </>
  );
}
