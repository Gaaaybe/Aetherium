import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Heart, Zap, Swords, Trash2, Edit, Eye, EyeOff, Shield, Target, Gauge, Plus, Minus, RotateCcw, Save } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/ui';
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
  const { removeCreature, toggleStatus, updateResources } = useCreatureBoardContext();
  const { onEditCreature, onSaveCreature } = useUIActions();
  const [hpInput, setHpInput] = useState('');
  const [peInput, setPeInput] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    setShowDeleteDialog(true);
  };

  const confirmRemove = () => {
    removeCreature(creature.id);
    setShowDeleteDialog(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCreature(creature.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveCreature) {
      onSaveCreature(creature.id);
    }
  };

  // Handlers de HP
  const handleHpChange = (delta: number) => {
    const newHp = Math.max(0, Math.min(creature.stats.maxHp, creature.stats.hp + delta));
    updateResources(creature.id, { hp: newHp });
  };

  const handleApplyHpInput = (isDamage: boolean) => {
    const value = parseInt(hpInput);
    if (isNaN(value) || value <= 0) return;
    
    const delta = isDamage ? -value : value;
    handleHpChange(delta);
    setHpInput('');
  };

  const handleResetHp = () => {
    updateResources(creature.id, { hp: creature.stats.maxHp });
  };

  // Handlers de PE
  const handlePeChange = (delta: number) => {
    const newPe = Math.max(0, Math.min(creature.stats.maxPe, creature.stats.pe + delta));
    updateResources(creature.id, { pe: newPe });
  };

  const handleApplyPeInput = (isSpend: boolean) => {
    const value = parseInt(peInput);
    if (isNaN(value) || value <= 0) return;
    
    const delta = isSpend ? -value : value;
    handlePeChange(delta);
    setPeInput('');
  };

  const handleResetPe = () => {
    updateResources(creature.id, { pe: creature.stats.maxPe });
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
      
      {/* Imagem (se houver) */}
      {creature.imageUrl && (
        <div className="relative h-32 overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
          <img
            src={creature.imageUrl}
            alt={creature.name}
            className="w-full h-full object-cover"
            style={creature.imagePosition ? { 
              objectPosition: `${creature.imagePosition.x}% ${creature.imagePosition.y}%` 
            } : undefined}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.parentElement!.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        </div>
      )}
      
      {/* Header */}
      <div 
        className={`p-3 text-white ${creature.imageUrl ? '' : 'rounded-t-lg'}`}
        style={{ backgroundColor: roleColor }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg truncate mb-1">{creature.name}</h3>
            {creature.notes && (
              <p className="text-xs opacity-90 line-clamp-2 mb-1">
                {creature.notes}
              </p>
            )}
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
      <div className="p-3 space-y-3">
        {/* HP Bar com Controles */}
        <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">PV</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHpChange(-10);
                }}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                title="Dano rápido (-10)"
              >
                <Minus className="w-3 h-3 text-red-600" />
              </button>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 min-w-[60px] text-center">
                {creature.stats.hp} / {creature.stats.maxHp}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHpChange(10);
                }}
                className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors"
                title="Cura rápida (+10)"
              >
                <Plus className="w-3 h-3 text-green-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetHp();
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Restaurar PV"
                disabled={creature.stats.hp === creature.stats.maxHp}
              >
                <RotateCcw className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="flex gap-1">
            <input
              type="number"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Valor"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApplyHpInput(true);
              }}
              disabled={!hpInput}
              className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 
                       text-red-700 dark:text-red-300 rounded disabled:opacity-50 whitespace-nowrap"
            >
              Dano
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApplyHpInput(false);
              }}
              disabled={!hpInput}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 
                       text-green-700 dark:text-green-300 rounded disabled:opacity-50 whitespace-nowrap"
            >
              Curar
            </button>
          </div>
        </div>

        {/* PE Bar com Controles (se tiver) */}
        {creature.stats.maxPe > 0 && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">PE</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePeChange(-creature.stats.effortUnit);
                  }}
                  className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                  title={`Gastar ${creature.stats.effortUnit} PE`}
                >
                  <Minus className="w-3 h-3 text-blue-600" />
                </button>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 min-w-[60px] text-center">
                  {creature.stats.pe} / {creature.stats.maxPe}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePeChange(creature.stats.effortUnit);
                  }}
                  className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                  title={`Recuperar ${creature.stats.effortUnit} PE`}
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPe();
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Restaurar PE"
                  disabled={creature.stats.pe === creature.stats.maxPe}
                >
                  <RotateCcw className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${pePercent}%` }}
              />
            </div>
            <div className="flex gap-1">
              <input
                type="number"
                value={peInput}
                onChange={(e) => setPeInput(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Valor"
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyPeInput(true);
                }}
                disabled={!peInput}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 
                         text-blue-700 dark:text-blue-300 rounded disabled:opacity-50 whitespace-nowrap"
              >
                Gastar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyPeInput(false);
                }}
                disabled={!peInput}
                className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 
                         text-green-700 dark:text-green-300 rounded disabled:opacity-50 whitespace-nowrap"
              >
                Recuperar
              </button>
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

        {/* Boss Mechanics - Soberania */}
        {creature.bossMechanics && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">⚡ Soberania</span>
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                {creature.bossMechanics.sovereignty}/{creature.bossMechanics.sovereigntyMax}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: creature.bossMechanics.sovereigntyMax }, (_, i) => i + 1).map((value) => (
                <button
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateResources(creature.id, { sovereignty: value });
                  }}
                  className={`flex-1 py-0.5 text-xs rounded transition-colors ${
                    creature.bossMechanics && creature.bossMechanics.sovereignty >= value
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white font-bold'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-end gap-1">
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
          
          {onSaveCreature && (
            <button
              onClick={handleSave}
              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
              title="Salvar na Biblioteca"
            >
              <Save className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
          )}
          
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

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmRemove}
        title="Remover Criatura"
        message={`Tem certeza que deseja remover "${creature.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}

// Memo para performance (não re-renderizar se props não mudarem)
export const CreatureNode = memo(CreatureNodeComponent);
