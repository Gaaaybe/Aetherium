import { useState, useEffect } from 'react';

/**
 * Hook para persistir estado no localStorage com sincronização entre abas/componentes
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Pega do localStorage
      const item = window.localStorage.getItem(key);
      // Parse ou retorna valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao carregar ${key} do localStorage:`, error);
      return initialValue;
    }
  });

  // Função para salvar no localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permite que value seja uma função (como useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Salva no estado
      setStoredValue(valueToStore);
      
      // Salva no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispara evento customizado para sincronizar outros componentes
      window.dispatchEvent(new CustomEvent('local-storage-change', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
    }
  };

  // Listener para mudanças no localStorage (incluindo de outros componentes)
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.value);
      }
    };

    // Listener para evento customizado
    window.addEventListener('local-storage-change', handleStorageChange);

    // Listener para mudanças de outras abas
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Erro ao sincronizar storage:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('local-storage-change', handleStorageChange);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}
