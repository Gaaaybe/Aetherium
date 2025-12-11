import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../shared/ui';
import { SAVES, getRoleDistribution, validateSaveDistribution, type Save } from '../data/constants';
import type { SaveDistribution, CreatureRole } from '../types';

interface SaveSelectorProps {
  role: CreatureRole;
  value: SaveDistribution | undefined;
  onChange: (distribution: SaveDistribution) => void;
}

/**
 * SaveSelector
 * 
 * Seletor de resistências (Fortitude, Reflexos, Vontade).
 * Mapeia Strong/Medium/Weak conforme a matriz de distribuição do role.
 */
export function SaveSelector({ role, value, onChange }: SaveSelectorProps) {
  const dist = getRoleDistribution(role);
  const [strongCount, mediumCount, weakCount] = dist.saves;

  const currentStrong = value?.strong || [];
  const currentMedium = value?.medium || [];

  // Auto-calcular weak
  const selectedSaves = new Set([...currentStrong, ...currentMedium]);
  const calculatedWeak = SAVES.filter(save => !selectedSaves.has(save));

  // Validação
  const validation = validateSaveDistribution(currentStrong, currentMedium, role);

  const handleSaveChange = (saveValue: Save | '', tier: 'strong' | 'medium', index: number) => {
    let newStrong = [...currentStrong];
    let newMedium = [...currentMedium];

    if (tier === 'strong') {
      if (saveValue === '') {
        newStrong = newStrong.filter((_, i) => i !== index);
      } else {
        // Remover de medium se já estiver lá
        newMedium = newMedium.filter(s => s !== saveValue);
        if (index < newStrong.length) {
          newStrong[index] = saveValue;
        } else {
          newStrong.push(saveValue);
        }
      }
    } else {
      if (saveValue === '') {
        newMedium = newMedium.filter((_, i) => i !== index);
      } else {
        // Remover de strong se já estiver lá
        newStrong = newStrong.filter(s => s !== saveValue);
        if (index < newMedium.length) {
          newMedium[index] = saveValue;
        } else {
          newMedium.push(saveValue);
        }
      }
    }

    const newWeak = SAVES.filter(s => !newStrong.includes(s) && !newMedium.includes(s));

    onChange({
      strong: newStrong,
      medium: newMedium,
      weak: newWeak,
    });
  };

  // Opções disponíveis para cada dropdown
  const getAvailableOptions = (tier: 'strong' | 'medium', currentIndex: number): Save[] => {
    const current = tier === 'strong' ? currentStrong : currentMedium;
    const other = tier === 'strong' ? currentMedium : currentStrong;
    const currentValue = current[currentIndex];

    return SAVES.filter(save => {
      // A opção atualmente selecionada está sempre disponível
      if (save === currentValue) return true;
      // Não mostrar se já está em outro tier
      if (other.includes(save)) return false;
      // Não mostrar se já está no mesmo tier (outro dropdown)
      if (current.includes(save)) return false;
      return true;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          DISTRIBUIÇÃO DE RESISTÊNCIAS
        </h3>
        {validation.isValid ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-orange-500" />
        )}
      </div>

      {/* Resistências Fortes */}
      {strongCount > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
            Resistências Fortes
            <Badge variant="info" size="sm">
              {currentStrong.length}/{strongCount}
            </Badge>
          </label>
          <div className="space-y-2">
            {Array.from({ length: strongCount }).map((_, index) => (
              <select
                key={`strong-${index}`}
                value={currentStrong[index] || ''}
                onChange={(e) => handleSaveChange(e.target.value as Save | '', 'strong', index)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-espirito-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {getAvailableOptions('strong', index).map(save => (
                  <option key={save} value={save}>
                    {save}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      )}

      {/* Resistências Médias */}
      {mediumCount > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
            Resistências Médias
            <Badge variant="secondary" size="sm">
              {currentMedium.length}/{mediumCount}
            </Badge>
          </label>
          <div className="space-y-2">
            {Array.from({ length: mediumCount }).map((_, index) => (
              <select
                key={`medium-${index}`}
                value={currentMedium[index] || ''}
                onChange={(e) => handleSaveChange(e.target.value as Save | '', 'medium', index)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-espirito-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {getAvailableOptions('medium', index).map(save => (
                  <option key={save} value={save}>
                    {save}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      )}

      {/* Resistências Fracas (Auto) */}
      {weakCount > 0 && calculatedWeak.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
            Resistências Fracas (Automático)
            <Badge variant="default" size="sm">
              {calculatedWeak.length}/{weakCount}
            </Badge>
          </label>
          <div className="flex flex-wrap gap-2">
            {calculatedWeak.map(save => (
              <span
                key={save}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
              >
                {save}
              </span>
            ))}
          </div>
        </div>
      )}

      {!validation.isValid && (
        <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {validation.error}
        </p>
      )}
    </div>
  );
}
