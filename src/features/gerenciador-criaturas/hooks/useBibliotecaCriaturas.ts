import { useState, useEffect, useCallback } from 'react';
import type { Creature } from '../types';

/**
 * Hook para gerenciar biblioteca de criaturas salvas
 * Permite salvar, carregar e gerenciar criaturas favoritas
 */
export function useBibliotecaCriaturas() {
  const STORAGE_KEY = 'spirit-caos:biblioteca-criaturas';
  
  const [savedCreatures, setSavedCreatures] = useState<Creature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar criaturas do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedCreatures(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar biblioteca de criaturas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCreatures));
      } catch (error) {
        console.error('Erro ao salvar biblioteca de criaturas:', error);
      }
    }
  }, [savedCreatures, isLoading]);

  // Salvar criatura na biblioteca
  const saveCreature = useCallback((creature: Creature) => {
    setSavedCreatures(prev => {
      // Verificar se já existe
      const exists = prev.some(c => c.id === creature.id);
      if (exists) {
        // Atualizar existente
        return prev.map(c => c.id === creature.id ? {
          ...creature,
          updatedAt: Date.now()
        } : c);
      }
      
      // Adicionar nova
      return [...prev, {
        ...creature,
        createdAt: creature.createdAt || Date.now(),
        updatedAt: Date.now()
      }];
    });
  }, []);

  // Remover criatura da biblioteca
  const removeCreature = useCallback((id: string) => {
    setSavedCreatures(prev => prev.filter(c => c.id !== id));
  }, []);

  // Carregar criatura da biblioteca (retorna uma cópia com novo ID)
  const loadCreature = useCallback((id: string): Creature | null => {
    const creature = savedCreatures.find(c => c.id === id);
    if (!creature) return null;

    // Retornar cópia com novo ID para não conflitar
    return {
      ...creature,
      id: `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Resetar recursos
      stats: {
        ...creature.stats,
        hp: creature.stats.maxHp,
        pe: creature.stats.maxPe,
      },
      // Resetar soberania se tiver
      bossMechanics: creature.bossMechanics ? {
        ...creature.bossMechanics,
        sovereignty: creature.bossMechanics.sovereigntyMax,
      } : undefined,
    };
  }, [savedCreatures]);

  // Duplicar criatura (criar cópia)
  const duplicateCreature = useCallback((id: string) => {
    const creature = savedCreatures.find(c => c.id === id);
    if (!creature) return;

    const duplicate: Creature = {
      ...creature,
      id: `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${creature.name} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSavedCreatures(prev => [...prev, duplicate]);
  }, [savedCreatures]);

  // Verificar se criatura está salva
  const isSaved = useCallback((id: string) => {
    return savedCreatures.some(c => c.id === id);
  }, [savedCreatures]);

  // Buscar criaturas
  const searchCreatures = useCallback((query: string) => {
    if (!query.trim()) return savedCreatures;

    const lowerQuery = query.toLowerCase();
    return savedCreatures.filter(creature => 
      creature.name.toLowerCase().includes(lowerQuery) ||
      creature.role.toLowerCase().includes(lowerQuery) ||
      creature.notes?.toLowerCase().includes(lowerQuery)
    );
  }, [savedCreatures]);

  // Filtrar por role
  const filterByRole = useCallback((role: string | null) => {
    if (!role) return savedCreatures;
    return savedCreatures.filter(c => c.role === role);
  }, [savedCreatures]);

  // Ordenar criaturas
  const sortCreatures = useCallback((
    creatures: Creature[],
    sortBy: 'name' | 'level' | 'role' | 'date' = 'name',
    order: 'asc' | 'desc' = 'asc'
  ) => {
    const sorted = [...creatures].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'level':
          comparison = a.level - b.level;
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'date':
          comparison = (a.updatedAt || a.createdAt) - (b.updatedAt || b.createdAt);
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, []);

  // Exportar biblioteca
  const exportLibrary = useCallback(() => {
    const dataStr = JSON.stringify(savedCreatures, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `biblioteca-criaturas-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [savedCreatures]);

  // Importar biblioteca
  const importLibrary = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = JSON.parse(content) as Creature[];
          
          if (!Array.isArray(imported)) {
            throw new Error('Formato inválido');
          }
          
          setSavedCreatures(prev => {
            const merged = [...prev];
            
            imported.forEach(creature => {
              const index = merged.findIndex(c => c.id === creature.id);
              if (index >= 0) {
                merged[index] = creature;
              } else {
                merged.push(creature);
              }
            });
            
            return merged;
          });
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }, []);

  return {
    savedCreatures,
    isLoading,
    saveCreature,
    removeCreature,
    loadCreature,
    duplicateCreature,
    isSaved,
    searchCreatures,
    filterByRole,
    sortCreatures,
    exportLibrary,
    importLibrary,
  };
}
