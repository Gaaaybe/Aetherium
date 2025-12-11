import { createContext, useContext, ReactNode } from 'react';
import { useCreatureBoard } from './useCreatureBoard';
import type { Creature, CreatureFormInput } from '../types';
import type { Node, Edge } from 'reactflow';

interface CreatureBoardContextValue {
  creatures: Creature[];
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  addCreature: (input: CreatureFormInput) => void;
  addCreatureFromLibrary: (creature: Creature) => void;
  removeCreature: (id: string) => void;
  updateCreature: (id: string, updates: Partial<Creature> & Partial<CreatureFormInput>) => void;
  updateHp: (id: string, currentHp: number) => void;
  updatePe: (id: string, currentPe: number) => void;
  updateResources: (id: string, updates: { hp?: number; pe?: number; sovereignty?: number }) => void;
  toggleStatus: (id: string) => void;
  clearBoard: () => void;
}

const CreatureBoardContext = createContext<CreatureBoardContextValue | undefined>(undefined);

export const CreatureBoardProvider = ({ children }: { children: ReactNode }) => {
  const board = useCreatureBoard();
  
  return (
    <CreatureBoardContext.Provider value={board}>
      {children}
    </CreatureBoardContext.Provider>
  );
};

export const useCreatureBoardContext = () => {
  const context = useContext(CreatureBoardContext);
  if (!context) {
    throw new Error('useCreatureBoardContext must be used within CreatureBoardProvider');
  }
  return context;
};
