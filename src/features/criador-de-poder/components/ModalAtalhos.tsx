import { Modal } from '../../../shared/ui';

interface ModalAtalhosProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalAtalhos({ isOpen, onClose }: ModalAtalhosProps) {
  const atalhos = [
    { tecla: 'Ctrl/Cmd + S', descricao: 'Salvar poder na biblioteca' },
    { tecla: 'Ctrl/Cmd + N', descricao: 'Criar novo poder (resetar)' },
    { tecla: 'Ctrl/Cmd + B', descricao: 'Abrir biblioteca de poderes' },
    { tecla: 'Ctrl/Cmd + E', descricao: 'Adicionar novo efeito' },
    { tecla: 'Ctrl/Cmd + M', descricao: 'Adicionar modificação global' },
    { tecla: 'Ctrl/Cmd + R', descricao: 'Ver resumo do poder' },
    { tecla: 'Esc', descricao: 'Fechar modal aberto' },
    { tecla: '?', descricao: 'Mostrar esta ajuda' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⌨️ Atalhos de Teclado"
      size="md"
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Use estes atalhos para trabalhar mais rapidamente:
        </p>
        
        <div className="space-y-2">
          {atalhos.map((atalho, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {atalho.descricao}
              </span>
              <kbd className="px-3 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                {atalho.tecla}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Dica:</strong> Os atalhos com Ctrl/Cmd funcionam mesmo quando você está digitando em campos de texto (exceto Ctrl+E e Ctrl+M).
          </p>
        </div>
      </div>
    </Modal>
  );
}
