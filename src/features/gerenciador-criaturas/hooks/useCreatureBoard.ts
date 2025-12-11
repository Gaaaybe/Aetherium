import { useState, useCallback } from 'react';
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

/**
 * Hook: useCreatureBoard
 * 
 * Gerencia o estado do board de criaturas (React Flow).
 * - Adiciona/remove criaturas
 * - Sincroniza nodes do React Flow com criaturas
 * - Persiste no LocalStorage (futuro)
 */
export function useCreatureBoard() {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

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
    const bossMechanics = calculateBossMechanics(input.role);
    
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stats,
      statsV2,
      attributeDistribution: input.attributeDistribution,
      saveDistribution: input.saveDistribution,
      selectedSkills: input.selectedSkills,
      bossMechanics,
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
            rdOverride: updates.rdOverride ?? c.stats.rd,
            speedOverride: updates.speedOverride ?? c.stats.speed,
            sovereigntyMultiplier: updates.sovereigntyMultiplier,
            sovereignty: updates.sovereignty ?? c.bossMechanics?.sovereignty,
            attributeDistribution: updates.attributeDistribution ?? c.attributeDistribution,
            saveDistribution: updates.saveDistribution ?? c.saveDistribution,
            selectedSkills: updates.selectedSkills ?? c.selectedSkills,
          };
          
          const newStats = calculateCreatureStats(input);
          const newBossMechanics = calculateBossMechanics(input.role);
          
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
    removeCreature,
    updateCreature,
    getCreature,
    
    // Combate
    updateHp,
    updatePe,
    toggleStatus,
    
    // Utilidades
    clearBoard,
    totalCreatures: creatures.length,
    activeCreatures: creatures.filter(c => c.status === 'ativo').length,
    defeatedCreatures: creatures.filter(c => c.status === 'derrotado').length,
  };
}
