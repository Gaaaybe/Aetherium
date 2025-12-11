import { useEffect } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { BottomSheet, BottomSheetFooter } from './BottomSheet';
import { useIsMobile } from '../hooks/useMediaQuery';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({ 
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  // Em mobile, usa BottomSheet
  if (isMobile) {
    return createPortal(
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        showCloseButton={showCloseButton}
      >
        {children}
      </BottomSheet>,
      document.body
    );
  }
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };
  
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  const isMobile = useIsMobile();

  // Em mobile, usa BottomSheetFooter
  if (isMobile) {
    return <BottomSheetFooter className={className}>{children}</BottomSheetFooter>;
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}
