import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CreatureNode } from './CreatureNode';
import { useCreatureBoardContext } from '../hooks/CreatureBoardContext';

// Registrar tipos de nodes customizados
const nodeTypes: NodeTypes = {
  creature: CreatureNode,
};

interface BoardCriaturasProps {
  className?: string;
}

/**
 * BoardCriaturas
 * 
 * Canvas interativo para visualizar e gerenciar criaturas em tempo real.
 * Usa React Flow para drag & drop, zoom, pan, etc.
 */
export function BoardCriaturas({ className = '' }: BoardCriaturasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useCreatureBoardContext();

  return (
    <div className={`w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50 dark:bg-gray-900"
      >
        {/* Background Pattern */}
        <Background 
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          className="bg-gray-50 dark:bg-gray-900"
        />
        
        {/* Controls (Zoom, Fit, etc) */}
        <Controls 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          showInteractive={false}
        />
        
        {/* MiniMap */}
        <MiniMap
          nodeStrokeWidth={3}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          maskColor="rgb(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
