import { useState } from 'react';
import { Modal, ModalFooter, Button, Input } from '../../../shared/ui';
import { Search, Sparkles, Check } from 'lucide-react';
import { useBibliotecaPoderes } from '../../criador-de-poder/hooks/useBibliotecaPoderes';
import type { Poder } from '../../criador-de-poder/types';

interface BibliotecaPoderesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPoder: (poder: Poder) => void;
}

export function BibliotecaPoderesModal({ isOpen, onClose, onSelectPoder }: BibliotecaPoderesModalProps) {
  const { poderes, buscarPoderComHydration } = useBibliotecaPoderes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredPoderes = poderes.filter(poder =>
    poder.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    if (!selectedId) return;
    
    const { poder } = buscarPoderComHydration(selectedId);
    if (poder) {
      onSelectPoder(poder);
      onClose();
      setSearchTerm('');
      setSelectedId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSearchTerm('');
        setSelectedId(null);
      }}
      title="Biblioteca de Poderes"
      size="lg"
    >
      <div className="space-y-4 py-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar poderes..."
            className="pl-10"
          />
        </div>

        {/* Lista de Poderes */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredPoderes.length > 0 ? (
            filteredPoderes.map((poder) => {
              const isSelected = selectedId === poder.id;
              
              return (
                <button
                  key={poder.id}
                  onClick={() => setSelectedId(poder.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-espirito-500 bg-espirito-50 dark:bg-espirito-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Sparkles className={`w-4 h-4 flex-shrink-0 ${
                        isSelected ? 'text-espirito-600 dark:text-espirito-400' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm truncate ${
                          isSelected 
                            ? 'text-espirito-900 dark:text-espirito-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {poder.nome}
                        </h3>
                        {poder.descricao && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                            {poder.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <Check className="w-5 h-5 text-espirito-600 dark:text-espirito-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{poder.efeitos.length} {poder.efeitos.length === 1 ? 'efeito' : 'efeitos'}</span>
                    <span>•</span>
                    <span>Alcance: {poder.alcance}m</span>
                    <span>•</span>
                    <span>Duração: {poder.duracao}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {searchTerm ? 'Nenhum poder encontrado' : 'Nenhum poder salvo'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {searchTerm
                  ? 'Tente buscar com outros termos'
                  : 'Crie poderes no Criador de Poderes para usar em suas criaturas'}
              </p>
            </div>
          )}
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={() => {
          onClose();
          setSearchTerm('');
          setSelectedId(null);
        }}>
          Cancelar
        </Button>
        <Button onClick={handleSelect} disabled={!selectedId}>
          Selecionar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
