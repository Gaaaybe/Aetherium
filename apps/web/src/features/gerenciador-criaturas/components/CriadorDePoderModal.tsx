import { useEffect, useRef } from 'react';
import { Modal, Button } from '../../../shared/ui';
import { CriadorDePoder } from '../../criador-de-poder/components/CriadorDePoder';
import { useBibliotecaPoderes } from '../../criador-de-poder/hooks/useBibliotecaPoderes';
import type { Poder } from '../../criador-de-poder/types';
import { CheckCircle } from 'lucide-react';

interface CriadorDePoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPoderCriado?: (poder: Poder) => void;
  onSave?: (poder: Poder) => void;
  poderParaEditar?: Poder;
  onUpdateRequest?: (id: string, payload: any) => Promise<any>;
}

export function CriadorDePoderModal({ isOpen, onClose, onPoderCriado, onSave, poderParaEditar, onUpdateRequest }: CriadorDePoderModalProps) {
  const { poderes } = useBibliotecaPoderes();
  const prevPoderesCount = useRef(poderes.length);
  const lastPoder = poderes[poderes.length - 1];

  // Reset baseline when modal opens so stale count doesn't trigger onSave immediately
  useEffect(() => {
    if (isOpen) {
      prevPoderesCount.current = poderes.length;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Detecta quando um novo poder é criado (não ao editar — nesse caso onSaved do CriadorDePoder já fecha)
  useEffect(() => {
    if (!poderParaEditar && isOpen && poderes.length > prevPoderesCount.current && lastPoder) {
      // Novo poder foi adicionado
      prevPoderesCount.current = poderes.length;
      if (onSave) onSave(lastPoder);
    }
  }, [poderes.length, lastPoder, isOpen, onSave, poderParaEditar]);

  const handleUsarPoderCriado = () => {
    if (lastPoder) {
      if (onPoderCriado) onPoderCriado(lastPoder);
      onClose();
    }
  };

  const poderRecenteSalvo = !poderParaEditar && isOpen && poderes.length > prevPoderesCount.current;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={poderParaEditar ? "Editar Poder" : "Criar Novo Poder"}
      size="xl"
    >
      <div className="py-4">
        {poderRecenteSalvo && lastPoder && onPoderCriado && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                    Poder "{lastPoder.nome}" salvo com sucesso!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Você pode usar este poder agora ou continuar criando.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleUsarPoderCriado}
                className="flex-shrink-0"
              >
                Usar Este Poder
              </Button>
            </div>
          </div>
        )}
        
        {!poderRecenteSalvo && !poderParaEditar && onPoderCriado && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 Dica:</strong> Crie e salve seu poder. Um botão aparecerá para você usá-lo imediatamente.
            </p>
          </div>
        )}
        
        <CriadorDePoder poderInicial={poderParaEditar} onSaved={onSave ? (poderSalvo) => onSave(poderSalvo) : undefined} onUpdateRequest={onUpdateRequest} />
      </div>
    </Modal>
  );
}
