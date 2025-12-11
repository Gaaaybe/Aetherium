import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../shared/ui';
import { ATTRIBUTES, getRoleDistribution, validateAttributeDistribution, type Attribute } from '../data/constants';
import type { AttributeDistribution, CreatureRole } from '../types';

interface AttributeSelectorProps {
  role: CreatureRole;
  value: AttributeDistribution | undefined;
  onChange: (distribution: AttributeDistribution) => void;
}

/**
 * AttributeSelector
 * 
 * Seletor dinâmico de atributos baseado no role.
 * Permite escolher Maior/Médio conforme a matriz de distribuição.
 */
export function AttributeSelector({ role, value, onChange }: AttributeSelectorProps) {
  const dist = getRoleDistribution(role);
  const [majorCount, mediumCount, minorCount] = dist.attrs;

  const currentMajor = value?.major || [];
  const currentMedium = value?.medium || [];

  // Calcular atributos disponíveis para cada tier
  const selectedAttrs = new Set([...currentMajor, ...currentMedium]);
  const availableForMajor = ATTRIBUTES.filter(attr => !currentMedium.includes(attr));
  const availableForMedium = ATTRIBUTES.filter(attr => !currentMajor.includes(attr));

  // Auto-calcular minor
  const calculatedMinor = ATTRIBUTES.filter(attr => !selectedAttrs.has(attr));

  // Validação
  const validation = validateAttributeDistribution(currentMajor, currentMedium, role);

  const toggleAttribute = (attr: Attribute, tier: 'major' | 'medium') => {
    let newMajor = [...currentMajor];
    let newMedium = [...currentMedium];

    if (tier === 'major') {
      if (currentMajor.includes(attr)) {
        newMajor = newMajor.filter(a => a !== attr);
      } else {
        if (newMajor.length < majorCount) {
          newMajor.push(attr);
        } else {
          // Substituir o primeiro
          newMajor = [...newMajor.slice(1), attr];
        }
      }
    } else {
      if (currentMedium.includes(attr)) {
        newMedium = newMedium.filter(a => a !== attr);
      } else {
        if (newMedium.length < mediumCount) {
          newMedium.push(attr);
        } else {
          // Substituir o primeiro
          newMedium = [...newMedium.slice(1), attr];
        }
      }
    }

    const newMinor = ATTRIBUTES.filter(
      a => !newMajor.includes(a) && !newMedium.includes(a)
    );

    onChange({
      major: newMajor,
      medium: newMedium,
      minor: newMinor,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          DISTRIBUIÇÃO DE ATRIBUTOS
        </h3>
        {validation.isValid ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-orange-500" />
        )}
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400">
        {dist.description}
      </p>

      {/* Atributos Maiores */}
      {majorCount > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
            Atributos Maiores
            <Badge variant="info" size="sm">
              {currentMajor.length}/{majorCount}
            </Badge>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {availableForMajor.map(attr => {
              const isSelected = currentMajor.includes(attr);
              return (
                <button
                  key={attr}
                  type="button"
                  onClick={() => toggleAttribute(attr, 'major')}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-blue-500 text-white shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {attr}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Atributos Médios */}
      {mediumCount > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
            Atributos Médios
            <Badge variant="secondary" size="sm">
              {currentMedium.length}/{mediumCount}
            </Badge>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {availableForMedium.map(attr => {
              const isSelected = currentMedium.includes(attr);
              return (
                <button
                  key={attr}
                  type="button"
                  onClick={() => toggleAttribute(attr, 'medium')}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-purple-500 text-white shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {attr}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Atributos Menores (Auto) */}
      {minorCount > 0 && calculatedMinor.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-2">
            Atributos Menores (Automático)
            <Badge variant="default" size="sm">
              {calculatedMinor.length}/{minorCount}
            </Badge>
          </label>
          <div className="flex flex-wrap gap-2">
            {calculatedMinor.map(attr => (
              <span
                key={attr}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
              >
                {attr}
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
