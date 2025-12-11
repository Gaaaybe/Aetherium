import { useState, useCallback, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import type { Creature, CreatureFormInput } from '../types';
import { calculateCreatureStats, calculateBossMechanics } from './calculateCreatureStats';
import { calculateCreatureStatsV2 } from './calculateCreatureStatsV2';

const STORAGE_KEY_BOARD = 'spirit-caos:board-criaturas';

/**
 * Hook: useCreatureBoard
 * 
 * Gerencia o estado do board de criaturas (React Flow).
 * - Adiciona/remove criaturas
 * - Sincroniza nodes do React Flow com criaturas
 * - Persiste no LocalStorage
 */
export function useCreatureBoard() {
  const [creatures, setCreatures] = useState<Creature[]>(() => {
    // Carregar do localStorage na inicialização
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOARD);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.creatures || [];
      }
    } catch (error) {
      console.error('Erro ao carregar board:', error);
    }
    return [];
  });
  
  const [nodes, setNodes] = useState<Node[]>(() => {
    // Carregar nodes do localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOARD);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedNodes = parsed.nodes || [];
        const loadedCreatures = parsed.creatures || [];
        
        // Sincronizar data dos nodes com creatures
        return loadedNodes.map((node: Node) => {
          const creature = loadedCreatures.find((c: Creature) => c.id === node.id);
          if (creature) {
            return { ...node, data: creature };
          }
          return node;
        });
      }
    } catch (error) {
      console.error('Erro ao carregar nodes:', error);
    }
    return [];
  });
  
  const [edges, setEdges] = useState<Edge[]>(() => {
    // Carregar edges do localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOARD);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.edges || [];
      }
    } catch (error) {
      console.error('Erro ao carregar edges:', error);
    }
    return [];
  });

  // Persistir no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOARD, JSON.stringify({
        creatures,
        nodes,
        edges,
      }));
    } catch (error) {
      console.error('Erro ao salvar board:', error);
    }
  }, [creatures, nodes, edges]);

  // Handlers de mudança (drag, resize, etc)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  /**
   * Adicionar criatura ao board
   */
  const addCreature = useCallback((input: CreatureFormInput) => {
    // Gerar ID único
    const id = `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calcular stats usando função pura
    const stats = calculateCreatureStats(input);
    if (!stats) {
      console.error('Falha ao calcular stats da criatura');
      return;
    }
    
    // Calcular mecânicas de chefe (se aplicável)
    const bossMechanics = calculateBossMechanics(input.role, input.sovereignty);
    
    // Soberania já vem inicializada do calculateBossMechanics
    
    // Calcular stats V2 se tiver distribuições
    let statsV2: typeof newCreature.statsV2 = undefined;
    if (input.attributeDistribution && input.saveDistribution) {
      try {
        statsV2 = calculateCreatureStatsV2(input) ?? undefined;
      } catch (error) {
        console.error('Erro ao calcular stats V2:', error);
      }
    }
    
    // Criar criatura completa
    const newCreature: Creature = {
      id,
      name: input.name,
      level: input.level,
      role: input.role,
      status: 'ativo',
      abilities: [],
      items: [],
      position: { 
        x: Math.random() * 400, 
        y: Math.random() * 400 
      },
      color: input.color,
      notes: input.notes,
      imageUrl: input.imageUrl,
      imagePosition: input.imagePosition,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stats,
      statsV2,
      attributeDistribution: input.attributeDistribution,
      saveDistribution: input.saveDistribution,
      selectedSkills: input.selectedSkills,
      bossMechanics,
      attacks: [],
      creatureAbilities: [],
    };

    // Adicionar aos arrays
    setCreatures(prev => [...prev, newCreature]);
    
    // Criar node do React Flow
    const newNode: Node = {
      id,
      type: 'creature',
      position: newCreature.position,
      data: newCreature,
      draggable: true,
    };
    
    setNodes(prev => [...prev, newNode]);
    
    return newCreature;
  }, []);

  /**
   * Adicionar criatura completa (da biblioteca)
   */
  const addCreatureFromLibrary = useCallback((creature: Creature) => {
    // Adicionar criatura já completa
    setCreatures(prev => [...prev, creature]);
    
    // Criar node do React Flow
    const newNode: Node = {
      id: creature.id,
      type: 'creature',
      position: creature.position,
      data: creature,
      draggable: true,
    };
    
    setNodes(prev => [...prev, newNode]);
    
    return creature;
  }, []);

  /**
   * Remover criatura
   */
  const removeCreature = useCallback((id: string) => {
    setCreatures(prev => prev.filter(c => c.id !== id));
    setNodes(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Atualizar criatura
   */
  const updateCreature = useCallback((id: string, updates: Partial<Creature & {
    rdOverride?: number;
    speedOverride?: number;
    sovereigntyMultiplier?: number;
    sovereignty?: number;
  }>) => {
    let updatedCreature: Creature | null = null;
    
    setCreatures(prev => 
      prev.map(c => {
        if (c.id !== id) return c;
        
        // Se mudou level ou role, recalcular stats
        const needsRecalc = updates.level !== undefined || updates.role !== undefined || 
                           updates.rdOverride !== undefined ||
                           updates.speedOverride !== undefined || updates.sovereigntyMultiplier !== undefined ||
                           updates.attributeDistribution !== undefined || updates.saveDistribution !== undefined ||
                           updates.selectedSkills !== undefined;
        
        if (needsRecalc) {
          const input: CreatureFormInput = {
            name: updates.name ?? c.name,
            level: updates.level ?? c.level,
            role: updates.role ?? c.role,
            notes: updates.notes ?? c.notes,
            color: updates.color ?? c.color,
            imageUrl: updates.imageUrl ?? c.imageUrl,
            imagePosition: updates.imagePosition ?? c.imagePosition,
            rdOverride: updates.rdOverride ?? c.stats.rd,
            speedOverride: updates.speedOverride ?? c.stats.speed,
            sovereigntyMultiplier: updates.sovereigntyMultiplier,
            sovereignty: updates.sovereignty ?? c.bossMechanics?.sovereignty,
            attributeDistribution: updates.attributeDistribution ?? c.attributeDistribution,
            saveDistribution: updates.saveDistribution ?? c.saveDistribution,
            selectedSkills: updates.selectedSkills ?? c.selectedSkills,
          };
          
          const newStats = calculateCreatureStats(input);
          const newBossMechanics = calculateBossMechanics(input.role, input.sovereignty);
          
          // Calcular stats V2 se tiver distribuições
          let newStatsV2: typeof c.statsV2 = undefined;
          if (input.attributeDistribution && input.saveDistribution) {
            try {
              newStatsV2 = calculateCreatureStatsV2(input) ?? undefined;
            } catch (error) {
              console.error('Erro ao calcular stats V2:', error);
            }
          }
          
          updatedCreature = {
            ...c,
            name: input.name,
            level: input.level,
            role: input.role,
            notes: input.notes,
            color: input.color,
            imageUrl: input.imageUrl,
            imagePosition: input.imagePosition,
            stats: newStats || c.stats,
            statsV2: newStatsV2,
            attributeDistribution: input.attributeDistribution,
            saveDistribution: input.saveDistribution,
            selectedSkills: input.selectedSkills,
            bossMechanics: newBossMechanics,
            updatedAt: Date.now(),
          };
          return updatedCreature;
        }
        
        updatedCreature = { ...c, ...updates, updatedAt: Date.now() };
        return updatedCreature;
      })
    );
    
    // Atualizar node com a criatura já atualizada
    setNodes(prev => 
      prev.map(n => {
        if (n.id === id && updatedCreature) {
          return { ...n, data: updatedCreature };
        }
        return n;
      })
    );
  }, []);

  /**
   * Atualizar HP de uma criatura
   */
  const updateHp = useCallback((id: string, newHp: number) => {
    setCreatures(prev => 
      prev.map(c => {
        if (c.id === id) {
          const hp = Math.max(0, Math.min(newHp, c.stats.maxHp));
          const status = hp === 0 ? 'derrotado' : c.status === 'derrotado' ? 'ativo' : c.status;
          return {
            ...c,
            stats: { ...c.stats, hp },
            status,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    // Atualizar node
    setNodes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const creature = creatures.find(c => c.id === id);
          if (creature) {
            const hp = Math.max(0, Math.min(newHp, creature.stats.maxHp));
            const status = hp === 0 ? 'derrotado' : creature.status === 'derrotado' ? 'ativo' : creature.status;
            return {
              ...n,
              data: {
                ...creature,
                stats: { ...creature.stats, hp },
                status,
              },
            };
          }
        }
        return n;
      })
    );
  }, [creatures]);

  /**
   * Atualizar PE de uma criatura
   */
  const updatePe = useCallback((id: string, newPe: number) => {
    setCreatures(prev =>
      prev.map(c => {
        if (c.id === id) {
          const pe = Math.max(0, Math.min(newPe, c.stats.maxPe));
          return {
            ...c,
            stats: { ...c.stats, pe },
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    // Atualizar node
    setNodes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const creature = creatures.find(c => c.id === id);
          if (creature) {
            const pe = Math.max(0, Math.min(newPe, creature.stats.maxPe));
            return {
              ...n,
              data: {
                ...creature,
                stats: { ...creature.stats, pe },
              },
            };
          }
        }
        return n;
      })
    );
  }, [creatures]);

  /**
   * Toggle status (ativo, oculto, derrotado)
   */
  const toggleStatus = useCallback((id: string) => {
    setCreatures(prev =>
      prev.map(c => {
        if (c.id === id) {
          let newStatus = c.status;
          if (c.status === 'ativo') newStatus = 'oculto';
          else if (c.status === 'oculto') newStatus = 'ativo';
          
          return { ...c, status: newStatus, updatedAt: Date.now() };
        }
        return c;
      })
    );

    // Atualizar node
    setNodes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const creature = creatures.find(c => c.id === id);
          if (creature) {
            let newStatus = creature.status;
            if (creature.status === 'ativo') newStatus = 'oculto';
            else if (creature.status === 'oculto') newStatus = 'ativo';
            
            return {
              ...n,
              data: { ...creature, status: newStatus },
            };
          }
        }
        return n;
      })
    );
  }, [creatures]);

  /**
   * Atualizar recursos (HP, PE, Soberania) de uma criatura
   */
  const updateResources = useCallback((id: string, updates: {
    hp?: number;
    pe?: number;
    sovereignty?: number;
  }) => {
    setCreatures(prev =>
      prev.map(c => {
        if (c.id !== id) return c;

        let updatedCreature = { ...c };

        // Atualizar HP
        if (updates.hp !== undefined) {
          const hp = Math.max(0, Math.min(updates.hp, c.stats.maxHp));
          const status = hp === 0 ? 'derrotado' : c.status === 'derrotado' ? 'ativo' : c.status;
          updatedCreature = {
            ...updatedCreature,
            stats: { ...updatedCreature.stats, hp },
            status,
          };
        }

        // Atualizar PE
        if (updates.pe !== undefined) {
          const pe = Math.max(0, Math.min(updates.pe, c.stats.maxPe));
          updatedCreature = {
            ...updatedCreature,
            stats: { ...updatedCreature.stats, pe },
          };
        }

        // Atualizar Soberania
        if (updates.sovereignty !== undefined && updatedCreature.bossMechanics) {
          const sovereignty = Math.max(
            0,
            Math.min(updates.sovereignty, updatedCreature.bossMechanics.sovereigntyMax)
          );
          updatedCreature = {
            ...updatedCreature,
            bossMechanics: {
              ...updatedCreature.bossMechanics,
              sovereignty,
            },
          };
        }

        return { ...updatedCreature, updatedAt: Date.now() };
      })
    );

    // Atualizar node
    setNodes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const creature = creatures.find(c => c.id === id);
          if (!creature) return n;

          let updatedData = { ...creature };

          if (updates.hp !== undefined) {
            const hp = Math.max(0, Math.min(updates.hp, creature.stats.maxHp));
            const status = hp === 0 ? 'derrotado' : creature.status === 'derrotado' ? 'ativo' : creature.status;
            updatedData = {
              ...updatedData,
              stats: { ...updatedData.stats, hp },
              status,
            };
          }

          if (updates.pe !== undefined) {
            const pe = Math.max(0, Math.min(updates.pe, creature.stats.maxPe));
            updatedData = {
              ...updatedData,
              stats: { ...updatedData.stats, pe },
            };
          }

          if (updates.sovereignty !== undefined && updatedData.bossMechanics) {
            const sovereignty = Math.max(
              0,
              Math.min(updates.sovereignty, updatedData.bossMechanics.sovereigntyMax)
            );
            updatedData = {
              ...updatedData,
              bossMechanics: {
                ...updatedData.bossMechanics,
                sovereignty,
              },
            };
          }

          return { ...n, data: updatedData };
        }
        return n;
      })
    );
  }, [creatures]);

  /**
   * Limpar board
   */
  const clearBoard = useCallback(() => {
    setCreatures([]);
    setNodes([]);
    setEdges([]);
  }, []);

  /**
   * Obter criatura por ID
   */
  const getCreature = useCallback((id: string) => {
    return creatures.find(c => c.id === id);
  }, [creatures]);

  return {
    // Estado
    creatures,
    nodes,
    edges,
    
    // React Flow handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    
    // CRUD
    addCreature,
    addCreatureFromLibrary,
    removeCreature,
    updateCreature,
    getCreature,
    
    // Combate
    updateHp,
    updatePe,
    updateResources,
    toggleStatus,
    
    // Utilidades
    clearBoard,
    totalCreatures: creatures.length,
    activeCreatures: creatures.filter(c => c.status === 'ativo').length,
    defeatedCreatures: creatures.filter(c => c.status === 'derrotado').length,
  };
}
