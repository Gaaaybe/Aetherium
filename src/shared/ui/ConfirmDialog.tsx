import { Modal, ModalFooter, Button } from './';
import { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
}: ConfirmDialogProps) {
  const [confirmando, setConfirmando] = useState(false);

  const handleConfirm = async () => {
    setConfirmando(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setConfirmando(false);
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '❓';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'primary' as const;
      case 'warning':
        return 'secondary' as const;
      case 'info':
        return 'primary' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirmação'}
      size="sm"
    >
      <div className="py-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{getIcon()}</div>
          <p className="text-gray-700 dark:text-gray-300 flex-1">
            {message}
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={confirmando}
        >
          {cancelText}
        </Button>
        <Button 
          variant={getButtonVariant()} 
          onClick={handleConfirm}
          className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}
          loading={confirmando}
          loadingText="Processando..."
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
