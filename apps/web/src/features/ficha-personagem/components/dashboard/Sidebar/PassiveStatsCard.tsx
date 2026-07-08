import { CharacterResponse } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { Eye, Footprints, Clock } from 'lucide-react';
import { calculateMovement } from '@aetherium/rules-engine';

interface PassiveStatsCardProps {
  character: CharacterResponse;
}

export function PassiveStatsCard({ character }: PassiveStatsCardProps) {
  // Cálculo de Percepção Passiva
  const perceptionSkill = character.skills.find(s => s.name === 'Percepção');
  const wisdomModifier = character.attributes.wisdom.rollModifier;
  
  let perceptionBonus = (perceptionSkill?.trainingBonus || 0) + wisdomModifier;
  
  if (perceptionSkill?.proficiencyState === 'EFFICIENT') {
    perceptionBonus += character.efficiencyBonus;
  } else if (perceptionSkill?.proficiencyState === 'INEFFICIENT') {
    perceptionBonus -= Math.round(character.efficiencyBonus / 2);
  }
  
  const passivePerception = 10 + perceptionBonus;

  // Cálculo de Iniciativa
  const initiativeSkill = character.skills.find(s => s.name === 'Iniciativa');
  const dexterityModifier = character.attributes.dexterity.rollModifier;
  
  let initiativeBonus = (initiativeSkill?.trainingBonus || 0) + dexterityModifier;
  
  if (initiativeSkill?.proficiencyState === 'EFFICIENT') {
    initiativeBonus += character.efficiencyBonus;
  } else if (initiativeSkill?.proficiencyState === 'INEFFICIENT') {
    initiativeBonus -= Math.round(character.efficiencyBonus / 2);
  }

  // Movimento calculado pelas condições do personagem
  const movement = calculateMovement(character.conditions);

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
          <Footprints className="w-4 h-4 text-emerald-500" />
          Exploração
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <Footprints className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Movimento</span>
          </div>
          <span className="text-xl font-black text-emerald-900 dark:text-emerald-100">
            {movement}m
          </span>
        </div>

        <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Percepção</span>
          </div>
          <span className="text-xl font-black text-blue-900 dark:text-blue-100">
            {passivePerception}
          </span>
        </div>

        <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Bônus de Iniciativa</span>
          </div>
          <span className="text-lg font-black text-purple-900 dark:text-purple-100">
            {initiativeBonus >= 0 ? `+${initiativeBonus}` : initiativeBonus}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
