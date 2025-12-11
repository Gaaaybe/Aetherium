import { X } from 'lucide-react';
import { Badge } from '../../../shared/ui';
import { SKILLS, type Skill } from '../data/constants';

interface SkillSelectorProps {
  value: Skill[];
  onChange: (skills: Skill[]) => void;
  maxSkills?: number;
}

/**
 * SkillSelector
 * 
 * Multi-seletor de perícias-chave.
 * Permite escolher quais perícias receberão o bônus de Perícia-Chave.
 */
export function SkillSelector({ value, onChange, maxSkills }: SkillSelectorProps) {
  const selectedSkills = value || [];

  const toggleSkill = (skill: Skill) => {
    if (selectedSkills.includes(skill)) {
      onChange(selectedSkills.filter(s => s !== skill));
    } else {
      onChange([...selectedSkills, skill]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          PERÍCIAS-CHAVE
        </h3>
        <Badge variant="info" size="sm">
          {selectedSkills.length}
          {maxSkills && `/${maxSkills}`}
        </Badge>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400">
        Selecione as perícias que receberão o bônus de Perícia-Chave
      </p>

      {/* Perícias Selecionadas */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          {selectedSkills.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              {skill}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Grid de Perícias */}
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
        {SKILLS.map(skill => {
          const isSelected = selectedSkills.includes(skill);
          const isDisabled = maxSkills !== undefined && selectedSkills.length >= maxSkills && !isSelected;

          return (
            <button
              key={skill}
              type="button"
              onClick={() => !isDisabled && toggleSkill(skill)}
              disabled={isDisabled}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                ${isSelected
                  ? 'bg-blue-500 text-white shadow-md'
                  : isDisabled
                    ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {skill}
            </button>
          );
        })}
      </div>

      {maxSkills && selectedSkills.length >= maxSkills && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Limite de {maxSkills} perícias atingido
        </p>
      )}
    </div>
  );
}
