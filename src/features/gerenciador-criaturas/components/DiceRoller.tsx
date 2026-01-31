import { useState } from 'react';
import { Dices, X } from 'lucide-react';
import { Button } from '../../../shared/ui';
import { rollD20, rollDamage, formatRollResult, type RollResult } from '../utils/diceRoller';

interface DiceRollerProps {
  /** Nome do teste (ex: "Ataque com Espada", "Percepção") */
  label: string;
  /** Modificador a ser aplicado no ataque */
  modifier: number;
  /** Fórmula de dano opcional (ex: "2d6+5") */
  damageFormula?: string;
  /** Modificador adicional de dano (bônus de ataque) */
  damageModifier?: number;
  /** Label customizado para o modificador (padrão: "Modificador") */
  modifierLabel?: string;
  /** Label customizado para o botão de rolar (padrão: "Rolar") */
  rollButtonLabel?: string;
  /** Callback ao fechar */
  onClose?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * DiceRoller
 * 
 * Modal simples para rolagem de dados.
 * Exibe resultados de ataque e dano.
 */
export function DiceRoller({ 
  label, 
  modifier, 
  damageFormula, 
  damageModifier = 0, 
  modifierLabel = "Modificador",
  rollButtonLabel = "Rolar",
  onClose, 
  className = '' 
}: DiceRollerProps) {
  const [attackRoll, setAttackRoll] = useState<RollResult | null>(null);
  const [damageRoll, setDamageRoll] = useState<{ total: number; rolls: number[]; modifier: number } | null>(null);

  const handleRollAttack = () => {
    const result = rollD20(modifier);
    setAttackRoll(result);
  };

  const handleRollDamage = () => {
    if (!damageFormula) return;
    const result = rollDamage(damageFormula);
    // Adiciona o modificador de dano (bônus de ataque)
    const totalWithBonus = result.total + damageModifier;
    setDamageRoll({
      ...result,
      total: totalWithBonus,
      modifier: result.modifier + damageModifier
    });
  };

  const handleReset = () => {
    setAttackRoll(null);
    setDamageRoll(null);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {label}
            </h3>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="!p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Modificador */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {modifierLabel}: <span className="font-semibold">{modifier >= 0 ? `+${modifier}` : modifier}</span>
          </p>
          {damageFormula && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Dano: <span className="font-semibold">{damageFormula}{damageModifier !== 0 ? (damageModifier >= 0 ? `+${damageModifier}` : `${damageModifier}`) : ''}</span>
            </p>
          )}
        </div>

        {/* Resultado do Ataque */}
        {attackRoll && (
          <div className={`mb-4 p-4 rounded-lg border-2 ${
            attackRoll.isCritical 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
              : attackRoll.isFumble 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
          }`}>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Rolagem de Ataque</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatRollResult(attackRoll)}
            </p>
          </div>
        )}

        {/* Resultado do Dano */}
        {damageRoll && (
          <div className="mb-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dano</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              💥 {damageRoll.total}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Dados: [{damageRoll.rolls.join(', ')}] 
              {damageRoll.modifier !== 0 && ` ${damageRoll.modifier >= 0 ? '+' : ''}${damageRoll.modifier}`}
            </p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            onClick={handleRollAttack}
            variant="primary"
            className="flex-1"
          >
            <Dices className="w-4 h-4 mr-2" />
            {rollButtonLabel}
          </Button>
          
          {damageFormula && attackRoll && (
            <Button
              onClick={handleRollDamage}
              variant="primary"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Rolar Dano
            </Button>
          )}
        </div>

        {/* Botão Reset */}
        {(attackRoll || damageRoll) && (
          <Button
            onClick={handleReset}
            variant="ghost"
            className="w-full mt-2"
          >
            Limpar Rolagens
          </Button>
        )}

        {/* Botão Fechar (se houver onClose) */}
        {onClose && (
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-2"
          >
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}
