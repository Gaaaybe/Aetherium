import { useState } from 'react';
import { CriadorDePoder } from '../features/criador-de-poder';
import { ModalAtalhos } from '../features/criador-de-poder/components/ModalAtalhos';
import { Button } from '../shared/ui';
import { useFirstVisit } from '../shared/hooks';

export function CriadorPage() {
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const [isFirstVisit, markAsVisited] = useFirstVisit('atalhos-visto');

  const abrirAtalhos = () => {
    setMostrarAtalhos(true);
    if (isFirstVisit) {
      markAsVisited();
    }
  };

  return (
    <div className="relative">
      {/* Botão de atalhos flutuante */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="relative">
          <Button 
            onClick={abrirAtalhos} 
            variant="ghost" 
            title="Atalhos de teclado (?)" 
            aria-label="Atalhos de teclado"
            className="shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          >
            ⌨️
          </Button>
          {isFirstVisit && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-espirito-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-espirito-500"></span>
            </span>
          )}
        </div>
      </div>

      <CriadorDePoder />
      
      <ModalAtalhos
        isOpen={mostrarAtalhos}
        onClose={() => setMostrarAtalhos(false)}
      />
    </div>
  );
}
