import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Heart, Zap, Swords, Trash2, Edit, Eye, EyeOff, Shield, Target, Gauge } from 'lucide-react';
import type { Creature } from '../types';
import { getRoleColor } from '../data/roleTemplates';
import { useCreatureBoardContext } from '../hooks/CreatureBoardContext';
import { useUIActions } from '../hooks/UIActionsContext';

/**
 * CreatureNode
 * 
 * Node customizado do React Flow para representar uma criatura no board.
 * Exibe stats principais e permite interações (editar, remover, ocultar).
 */
function CreatureNodeComponent({ data }: NodeProps<Creature>) {
  const creature = data;
  const roleColor = getRoleColor(creature.role);
  const { removeCreature, toggleStatus } = useCreatureBoardContext();
  const { onEditCreature } = useUIActions();

  // Calcular porcentagem de HP e PE
  const hpPercent = (creature.stats.hp / creature.stats.maxHp) * 100;
  const pePercent = creature.stats.maxPe > 0 ? (creature.stats.pe / creature.stats.maxPe) * 100 : 0;

  // Status visual
  const isDefeated = creature.status === 'derrotado';
  const isHidden = creature.status === 'oculto';
  const isAlly = creature.status === 'aliado';

  // Handlers
  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatus(creature.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remover ${creature.name}?`)) {
      removeCreature(creature.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCreature(creature.id);
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 
        transition-all duration-200 w-[380px]
        ${isDefeated ? 'opacity-50 grayscale' : ''}
        ${isHidden ? 'opacity-40' : ''}
      `}
      style={{ borderColor: roleColor }}
    >
      {/* Handle de conexão (opcional para futuro) */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* Header */}
      <div 
        className="p-3 rounded-t-lg text-white"
        style={{ backgroundColor: roleColor }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg truncate mb-1">{creature.name}</h3>
            <div className="flex items-center gap-2 text-xs opacity-90">
              <span>Nível {creature.level}</span>
              <span>•</span>
              <span>{creature.role}</span>
            </div>
          </div>
          
          {/* Status Badge */}
          {isAlly && (
            <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
              Aliado
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 space-y-2">
        {/* HP Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">PV</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {creature.stats.hp} / {creature.stats.maxHp}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* PE Bar (se tiver) */}
        {creature.stats.maxPe > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">PE</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {creature.stats.pe} / {creature.stats.maxPe}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${pePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Defesas */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">DEFESAS</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">RD</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{creature.stats.rd}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Desl.</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{creature.stats.speed}m</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">CD</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{creature.stats.cdEffect}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ataque */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ATAQUE</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Bônus de Ataque</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              +{creature.statsV2?.combat.attackBonus ?? creature.stats.attackBonus}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Dano Base</span>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {creature.statsV2?.combat.damage ?? creature.stats.damage}
            </span>
          </div>
        </div>

        {/* Resistências */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">RESISTÊNCIAS</p>
          
          {creature.statsV2 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Fortitude</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {creature.statsV2.saves.Fortitude >= 0 ? '+' : ''}{creature.statsV2.saves.Fortitude}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Reflexos</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {creature.statsV2.saves.Reflexos >= 0 ? '+' : ''}{creature.statsV2.saves.Reflexos}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Vontade</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {creature.statsV2.saves.Vontade >= 0 ? '+' : ''}{creature.statsV2.saves.Vontade}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Res. Menor</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{creature.stats.resistances.minor >= 0 ? '+' : ''}{creature.stats.resistances.minor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Res. Média</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{creature.stats.resistances.medium >= 0 ? '+' : ''}{creature.stats.resistances.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Res. Maior</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{creature.stats.resistances.major >= 0 ? '+' : ''}{creature.stats.resistances.major}</span>
              </div>
            </div>
          )}
        </div>

        {/* Atributos */}
        {creature.statsV2 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ATRIBUTOS</p>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
              {Object.entries(creature.statsV2.attributes).map(([attr, value]) => (
                <div key={attr} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{attr.substring(0, 3)}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perícias-Chave */}
        {creature.statsV2 && Object.keys(creature.statsV2.skills).length > 0 ? (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">PERÍCIAS-CHAVE</p>
            <div className="space-y-0.5 text-xs max-h-24 overflow-y-auto">
              {Object.entries(creature.statsV2.skills).map(([skill, value]) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{skill}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">+{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Perícia Chave</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">+{creature.stats.keySkill}</span>
            </div>
          </div>
        )}

        {/* Recursos */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">RECURSOS</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Unidade Esforço</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{creature.stats.effortUnit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Eficiência</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">+{creature.stats.efficiency}</span>
            </div>
          </div>
        </div>

        {/* Boss Mechanics */}
        {creature.bossMechanics && (
          <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">⚡ Soberania</span>
              <span className="font-bold text-yellow-600 dark:text-yellow-400">
                {creature.bossMechanics.sovereignty}/{creature.bossMechanics.sovereigntyMax}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        {creature.notes && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {creature.notes}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={handleToggleVisibility}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={isHidden ? 'Mostrar' : 'Ocultar'}
          >
            {isHidden ? (
              <EyeOff className="w-4 h-4 text-gray-500" />
            ) : (
              <Eye className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          <button
            onClick={handleEdit}
            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          
          <button
            onClick={handleRemove}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Remover"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

// Memo para performance (não re-renderizar se props não mudarem)
export const CreatureNode = memo(CreatureNodeComponent);
