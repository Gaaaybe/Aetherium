import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export const toast = {
  success: (message: string) => {
    const newToast: Toast = { id: toastId++, message, type: 'success' };
    listeners.forEach(listener => listener(newToast));
  },
  error: (message: string) => {
    const newToast: Toast = { id: toastId++, message, type: 'error' };
    listeners.forEach(listener => listener(newToast));
  },
  warning: (message: string) => {
    const newToast: Toast = { id: toastId++, message, type: 'warning' };
    listeners.forEach(listener => listener(newToast));
  },
  info: (message: string) => {
    const newToast: Toast = { id: toastId++, message, type: 'info' };
    listeners.forEach(listener => listener(newToast));
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      
      // Agendar remoção automática
      const timeout = setTimeout(() => {
        removeToast(toast.id);
      }, 3000);
      
      timeoutsRef.current.set(toast.id, timeout);
    };

    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
      // Limpar todos os timeouts pendentes
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, [removeToast]);

  return toasts;
}

export function ToastContainer() {
  const toasts = useToast();

  const getToastStyles = (type: Toast['type']) => {
    const baseStyles = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in';
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white`;
      case 'info':
        return `${baseStyles} bg-blue-500 text-white`;
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={getToastStyles(toast.type)}>
          <span className="text-xl">{getIcon(toast.type)}</span>
          <span className="font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
