import { useEffect, useRef } from 'react';
import { Modal, Button } from '../../../shared/ui';
import { CriadorDePoder } from '../../criador-de-poder/components/CriadorDePoder';
import { useBibliotecaPoderes } from '../../criador-de-poder/hooks/useBibliotecaPoderes';
import type { Poder } from '../../criador-de-poder/types';
import { CheckCircle } from 'lucide-react';

interface CriadorDePoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPoderCriado: (poder: Poder) => void;
}

export function CriadorDePoderModal({ isOpen, onClose, onPoderCriado }: CriadorDePoderModalProps) {
  const { poderes } = useBibliotecaPoderes();
  const prevPoderesCount = useRef(poderes.length);
  const lastPoder = poderes[poderes.length - 1];

  // Detecta quando um novo poder é salvo
  useEffect(() => {
    if (isOpen && poderes.length > prevPoderesCount.current && lastPoder) {
      // Novo poder foi adicionado
      prevPoderesCount.current = poderes.length;
    }
  }, [poderes.length, lastPoder, isOpen]);

  const handleUsarPoderCriado = () => {
    if (lastPoder) {
      onPoderCriado(lastPoder);
      onClose();
    }
  };

  const poderRecenteSalvo = isOpen && poderes.length > prevPoderesCount.current;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Novo Poder"
      size="xl"
    >
      <div className="py-4">
        {poderRecenteSalvo && lastPoder && (
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
        
        {!poderRecenteSalvo && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 Dica:</strong> Crie e salve seu poder. Um botão aparecerá para você usá-lo imediatamente.
            </p>
          </div>
        )}
        
        <CriadorDePoder />
      </div>
    </Modal>
  );
}
