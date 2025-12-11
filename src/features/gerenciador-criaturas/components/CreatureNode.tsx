import { memo, useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Heart, Zap, Swords, Trash2, Edit, Eye, EyeOff, Shield, Target, Gauge, Plus, Minus, RotateCcw, Save, ChevronRight, ChevronLeft, Sparkles, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/ui';
import { FormAtaque } from './FormAtaque';
import { FormHabilidade } from './FormHabilidade';
import { ResumoPoder } from '../../criador-de-poder/components/ResumoPoder';
import { calcularDetalhesPoder } from '../../criador-de-poder/regras/calculadoraCusto';
import { EFEITOS, MODIFICACOES } from '../../../data';
import type { Creature, CreatureAttack, CreatureAbility } from '../types';
import type { Poder } from '../../criador-de-poder/types';
import { getRoleColor } from '../data/roleTemplates';
import { useCreatureBoardContext } from '../hooks/CreatureBoardContext';
import { useUIActions } from '../hooks/UIActionsContext';

// Tipo temporário para Poder até integração completa
interface PoderTemp {
  efeitos?: unknown[];
  descricao?: string;
}

/**
 * CreatureNode
 * 
 * Node customizado do React Flow para representar uma criatura no board.
 * Exibe stats principais e permite interações (editar, remover, ocultar).
 */
function CreatureNodeComponent({ data }: NodeProps<Creature>) {
  const creature = data;
  const roleColor = getRoleColor(creature.role);
  const { removeCreature, toggleStatus, updateResources, updateCreature } = useCreatureBoardContext();
  const { onEditCreature, onSaveCreature } = useUIActions();
  const [hpInput, setHpInput] = useState('');
  const [peInput, setPeInput] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAbilities, setShowAbilities] = useState(false);
  const [showAttackForm, setShowAttackForm] = useState(false);
  const [editingAttack, setEditingAttack] = useState<CreatureAttack | null>(null);
  const [deleteAttackId, setDeleteAttackId] = useState<string | null>(null);
  const [showAbilityForm, setShowAbilityForm] = useState(false);
  const [editingAbility, setEditingAbility] = useState<CreatureAbility | null>(null);
  const [deleteAbilityId, setDeleteAbilityId] = useState<string | null>(null);
  const [viewingAbility, setViewingAbility] = useState<CreatureAbility | null>(null);
  const [expandedAbilityId, setExpandedAbilityId] = useState<string | null>(null);

  // Calcular detalhes do poder visualizado (memoizado)
  const viewingAbilityDetails = useMemo(() => {
    if (!viewingAbility) return null;
    return calcularDetalhesPoder(viewingAbility.poder as Poder, EFEITOS, MODIFICACOES);
  }, [viewingAbility]);

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

  // Handler de Ataques
  const handleAddAttack = (attackData: Omit<CreatureAttack, 'id'>) => {
    if (editingAttack) {
      // Editar ataque existente
      updateCreature(creature.id, {
        attacks: creature.attacks.map(a => 
          a.id === editingAttack.id ? { ...attackData, id: editingAttack.id } : a
        ),
      });
      setEditingAttack(null);
    } else {
      // Adicionar novo ataque
      const newAttack: CreatureAttack = {
        ...attackData,
        id: `attack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      
      updateCreature(creature.id, {
        attacks: [...(creature.attacks || []), newAttack],
      });
    }
  };

  const handleEditAttack = (attack: CreatureAttack) => {
    setEditingAttack(attack);
    setShowAttackForm(true);
  };

  const handleDeleteAttack = (attackId: string) => {
    updateCreature(creature.id, {
      attacks: creature.attacks.filter(a => a.id !== attackId),
    });
    setDeleteAttackId(null);
  };

  // Handlers de Habilidades
  const handleAddAbility = (abilityData: Omit<CreatureAbility, 'id'>) => {
    if (editingAbility) {
      // Atualizar habilidade existente
      updateCreature(creature.id, {
        creatureAbilities: creature.creatureAbilities.map(a => 
          a.id === editingAbility.id ? { ...abilityData, id: editingAbility.id } : a
        ),
      });
      setEditingAbility(null);
    } else {
      // Criar nova habilidade
      const newAbility: CreatureAbility = {
        ...abilityData,
        id: `ability-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      
      updateCreature(creature.id, {
        creatureAbilities: [...(creature.creatureAbilities || []), newAbility],
      });
    }
  };

  const handleEditAbility = (ability: CreatureAbility) => {
    setEditingAbility(ability);
    setShowAbilityForm(true);
  };

  const handleDeleteAbility = (abilityId: string) => {
    updateCreature(creature.id, {
      creatureAbilities: creature.creatureAbilities.filter(a => a.id !== abilityId),
    });
    setDeleteAbilityId(null);
  };

  const handleMoveAbility = (abilityId: string, direction: 'up' | 'down') => {
    const abilities = creature.creatureAbilities || [];
    const currentIndex = abilities.findIndex(a => a.id === abilityId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= abilities.length) return;
    
    const newAbilities = [...abilities];
    [newAbilities[currentIndex], newAbilities[newIndex]] = [newAbilities[newIndex], newAbilities[currentIndex]];
    
    updateCreature(creature.id, {
      creatureAbilities: newAbilities,
    });
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
    <div className="relative">
      {/* Card Principal - "Bancada do Armário" */}
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
      </div>

      {/* Aba Lateral - Toggle da "Gaveta" */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowAbilities(!showAbilities);
        }}
        className={`
          absolute top-1/2 -translate-y-1/2 -right-8
          w-8 h-20 rounded-r-lg
          bg-gradient-to-r from-gray-700 to-gray-600 dark:from-gray-600 dark:to-gray-700
          hover:from-gray-600 hover:to-gray-500 dark:hover:from-gray-500 dark:hover:to-gray-600
          shadow-lg border-2 border-l-0
          flex items-center justify-center
          transition-all duration-300 z-10
          ${showAbilities ? 'translate-x-[340px]' : ''}
        `}
        style={{ borderColor: roleColor }}
        title={showAbilities ? "Ocultar Ataques/Habilidades" : "Mostrar Ataques/Habilidades"}
      >
        {showAbilities ? (
          <ChevronRight className="w-5 h-5 text-white" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Painel Lateral - A "Gaveta" com profundidade */}
      <div
        className={`
          absolute top-0 right-0 h-full w-[340px]
          bg-gray-100 dark:bg-gray-900 rounded-r-lg
          shadow-inner border-2 border-l-0
          transition-all duration-300 ease-in-out
          overflow-hidden
          ${showAbilities ? 'translate-x-full opacity-100' : 'translate-x-0 opacity-0 pointer-events-none'}
        `}
        style={{ 
          borderColor: roleColor,
          // Efeito de profundidade - como se estivesse "dentro" do card
          boxShadow: showAbilities 
            ? 'inset 4px 0 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.2)' 
            : 'none',
          // Z-index negativo para ficar "atrás" do card
          zIndex: -1
        }}
      >
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {/* Seção de Ataques */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
              <Swords className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h4 className="font-bold text-gray-900 dark:text-gray-100">Ataques Simples</h4>
            </div>
            
            {/* Lista de ataques */}
            <div className="space-y-2">
              {creature.attacks && creature.attacks.length > 0 ? (
                creature.attacks.map((attack) => {
                  const rangeText = attack.range.type === 'adjacente' ? 'Adjacente' :
                                   attack.range.type === 'natural' ? 'Natural' :
                                   attack.range.type === 'curto' ? 'Distância (Curto)' :
                                   attack.range.type === 'medio' ? 'Distância (Médio)' :
                                   attack.range.type === 'longo' ? 'Distância (Longo)' :
                                   'Variável';
                  const fullRange = attack.range.additionalMeters 
                    ? `${rangeText} +${attack.range.additionalMeters}m`
                    : rangeText;

                  return (
                    <div key={attack.id} className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 shadow-sm group">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{attack.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAttack(attack);
                            }}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteAttackId(attack.id);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-medium">
                          {attack.damage}
                        </span>
                        <span className="text-xs text-gray-900 dark:text-gray-100">
                          {attack.damageType === 'cortante' ? 'Corte' :
                           attack.damageType === 'perfurante' ? 'Perfuração' :
                           attack.damageType === 'contundente' ? 'Impacto' :
                           attack.damageType}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                          {attack.criticalRange}-20 / x{attack.criticalMultiplier}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 mb-1">
                        <Target className="w-3 h-3" />
                        <span>{fullRange}</span>
                      </div>
                      {attack.effect && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2 mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                          {attack.effect}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3 italic">
                  Nenhum ataque cadastrado
                </p>
              )}
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowAttackForm(true);
              }}
              className="w-full mt-2 py-1.5 text-xs border-2 border-dashed border-gray-300 dark:border-gray-600 rounded
                             hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800
                             text-gray-600 dark:text-gray-400 transition-colors flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" />
              Adicionar Ataque
            </button>
          </div>

          {/* Seção de Habilidades */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-bold text-gray-900 dark:text-gray-100">Habilidades</h4>
            </div>
            
            {/* Lista de habilidades */}
            <div className="space-y-2">
              {creature.creatureAbilities && creature.creatureAbilities.length > 0 ? (
                creature.creatureAbilities.map((ability, index) => {
                  const realPeCost = ability.effortCost * creature.stats.effortUnit;
                  const isExpanded = expandedAbilityId === ability.id;
                  const hasDescription = !!(ability.poder as PoderTemp).descricao;
                  const isFirst = index === 0;
                  const isLast = index === creature.creatureAbilities.length - 1;
                  
                  return (
                    <div 
                      key={ability.id} 
                      className="p-2.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 shadow-sm group hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-2">
                        {/* Botões de reordenar */}
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveAbility(ability.id, 'up');
                            }}
                            disabled={isFirst}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveAbility(ability.id, 'down');
                            }}
                            disabled={isLast}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>

                        {/* Conteúdo da habilidade */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingAbility(ability);
                          }}
                          title="Clique para ver detalhes completos"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 break-words">
                                  {ability.name}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium whitespace-nowrap">
                                  {realPeCost} PE
                                </span>
                              </div>
                              {hasDescription && (
                                <div>
                                  <p className={`text-xs text-gray-600 dark:text-gray-400 italic ${isExpanded ? '' : 'line-clamp-3'}`}>
                                    {(ability.poder as PoderTemp).descricao}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedAbilityId(isExpanded ? null : ability.id);
                                    }}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-1 flex items-center gap-1"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        Ver menos
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        Ver mais
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAbility(ability);
                                }}
                                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteAbilityId(ability.id);
                                }}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3 italic">
                  Nenhuma habilidade cadastrada
                </p>
              )}
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowAbilityForm(true);
              }}
              className="w-full mt-2 py-1.5 text-xs border-2 border-dashed border-gray-300 dark:border-gray-600 rounded
                             hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800
                             text-gray-600 dark:text-gray-400 transition-colors flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" />
              Adicionar Habilidade
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Ataque */}
      <FormAtaque
        key={editingAttack?.id || 'new'}
        isOpen={showAttackForm}
        onClose={() => {
          setShowAttackForm(false);
          setEditingAttack(null);
        }}
        onSubmit={handleAddAttack}
        initialData={editingAttack || undefined}
        mode={editingAttack ? 'edit' : 'create'}
      />

      {/* Modal de Habilidade */}
      <FormHabilidade
        key={editingAbility?.id || 'new'}
        isOpen={showAbilityForm}
        onClose={() => {
          setShowAbilityForm(false);
          setEditingAbility(null);
        }}
        onSubmit={handleAddAbility}
        initialData={editingAbility || undefined}
        mode={editingAbility ? 'edit' : 'create'}
        effortUnitValue={creature.stats.effortUnit}
      />

      {/* Dialog de Confirmação - Remover Criatura */}
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

      {/* Dialog de Confirmação - Remover Ataque */}
      <ConfirmDialog
        isOpen={!!deleteAttackId}
        onClose={() => setDeleteAttackId(null)}
        onConfirm={() => {
          if (deleteAttackId) handleDeleteAttack(deleteAttackId);
        }}
        title="Remover Ataque"
        message="Tem certeza que deseja remover este ataque? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Dialog de Confirmação - Remover Habilidade */}
      <ConfirmDialog
        isOpen={!!deleteAbilityId}
        onClose={() => setDeleteAbilityId(null)}
        onConfirm={() => {
          if (deleteAbilityId) handleDeleteAbility(deleteAbilityId);
        }}
        title="Remover Habilidade"
        message="Tem certeza que deseja remover esta habilidade? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Modal de Visualização da Habilidade */}
      {viewingAbility && viewingAbilityDetails && (
        <ResumoPoder
          isOpen={!!viewingAbility}
          onClose={() => setViewingAbility(null)}
          poder={viewingAbility.poder as Poder}
          detalhes={viewingAbilityDetails}
        />
      )}
    </div>
  );
}

// Função de comparação personalizada para memo
function arePropsEqual(prevProps: NodeProps<Creature>, nextProps: NodeProps<Creature>) {
  // Só re-renderizar se os dados da criatura ou posição mudaram
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data === nextProps.data &&
    prevProps.dragging === nextProps.dragging
  );
}

// Memo para performance (não re-renderizar se props não mudarem)
export const CreatureNode = memo(CreatureNodeComponent, arePropsEqual);
