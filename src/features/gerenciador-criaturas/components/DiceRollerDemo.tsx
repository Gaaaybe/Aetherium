import { useState } from 'react';
import { Dices } from 'lucide-react';
import { Button } from '../../../shared/ui';
import { DiceRoller } from './DiceRoller';
import { rollD20, rollDamage } from '../utils/diceRoller';

/**
 * DiceRollerDemo
 * 
 * Componente de demonstração do sistema de rolagem.
 * Use para testar as funcionalidades ou como referência.
 */
export function DiceRollerDemo() {
  const [showRoller, setShowRoller] = useState(false);
  const [lastRoll, setLastRoll] = useState<string>('');

  const handleQuickRoll = () => {
    const result = rollD20(5);
    setLastRoll(`d20+5: ${result.total} ${result.isCritical ? '⭐' : result.isFumble ? '💀' : ''}`);
  };

  const handleDamageRoll = () => {
    const result = rollDamage('2d6+3');
    setLastRoll(`2d6+3: ${result.total} [${result.rolls.join(', ')}]`);
  };

  return (
    <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Dices className="w-5 h-5" />
        Sistema de Rolagem - Demo
      </h3>

      <div className="space-y-3">
        {/* Rolagem com Modal */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Rolagem completa (ataque + dano):
          </p>
          <Button
            onClick={() => setShowRoller(true)}
            variant="primary"
            size="sm"
          >
            <Dices className="w-4 h-4 mr-2" />
            Abrir Rolador
          </Button>
        </div>

        {/* Rolagem rápida */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Rolagens rápidas (diretas):
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleQuickRoll}
              variant="outline"
              size="sm"
            >
              d20+5
            </Button>
            <Button
              onClick={handleDamageRoll}
              variant="outline"
              size="sm"
            >
              2d6+3
            </Button>
          </div>
        </div>

        {/* Último resultado */}
        {lastRoll && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {lastRoll}
            </p>
          </div>
        )}
      </div>

      {/* Modal do DiceRoller */}
      {showRoller && (
        <DiceRoller
          label="Espada Longa +1"
          modifier={7}
          damageFormula="1d8+5"
          damageModifier={7}
          onClose={() => setShowRoller(false)}
        />
      )}
    </div>
  );
}
