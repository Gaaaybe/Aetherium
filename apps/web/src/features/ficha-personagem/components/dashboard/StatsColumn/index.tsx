import { useState } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Modal, ModalFooter, Button, Input, Select } from '@/shared/ui';
import { Brain, Dumbbell, ShieldCheck, ListFilter, Edit2, Shield, Circle, Dices } from 'lucide-react';
import { DiceRoller } from '@/shared/components/DiceRoller';
import { obterBonusFortalecerAtivos } from '@/features/ficha-personagem/utils/fortalecerHelper';

interface StatsColumnProps {
  character: CharacterResponse;
  onSync: (data: SyncCharacterData) => Promise<void>;
  activePowers?: any[];
  deactivatePower?: (id: string) => void;
}

const SKILL_ATTRIBUTE_MAP: Record<string, { key: keyof CharacterResponse['attributes'], label: string, order: number, color: string }> = {
  'Atletismo': { key: 'strength', label: 'FOR', order: 1, color: 'text-red-500' },
  'Acrobacia': { key: 'dexterity', label: 'DES', order: 2, color: 'text-orange-500' },
  'Cavalgar': { key: 'dexterity', label: 'DES', order: 2, color: 'text-orange-500' },
  'Furtividade': { key: 'dexterity', label: 'DES', order: 2, color: 'text-orange-500' },
  'Iniciativa': { key: 'dexterity', label: 'DES', order: 2, color: 'text-orange-500' },
  'Ladinagem': { key: 'dexterity', label: 'DES', order: 2, color: 'text-orange-500' },
  'Pilotar': { key: 'dexterity', label: 'DES', order: 2, color: 'text-orange-500' },
  'Reflexos': { key: 'dexterity', label: 'DES', order: 2, color: 'text-orange-500' },
  'Fortitude': { key: 'constitution', label: 'CON', order: 3, color: 'text-yellow-500' },
  'Conhecimento': { key: 'intelligence', label: 'INT', order: 4, color: 'text-blue-500' },
  'Espiritismo': { key: 'intelligence', label: 'INT', order: 4, color: 'text-blue-500' },
  'Investigação': { key: 'intelligence', label: 'INT', order: 4, color: 'text-blue-500' },
  'Adestrar Animais': { key: 'wisdom', label: 'SAB', order: 5, color: 'text-green-500' },
  'Cura': { key: 'wisdom', label: 'SAB', order: 5, color: 'text-green-500' },
  'Exploração': { key: 'wisdom', label: 'SAB', order: 5, color: 'text-green-500' },
  'Intuição': { key: 'wisdom', label: 'SAB', order: 5, color: 'text-green-500' },
  'Percepção': { key: 'wisdom', label: 'SAB', order: 5, color: 'text-green-500' },
  'Religião': { key: 'wisdom', label: 'SAB', order: 5, color: 'text-green-500' },
  'Sobrevivência': { key: 'wisdom', label: 'SAB', order: 5, color: 'text-green-500' },
  'Atuação': { key: 'charisma', label: 'CAR', order: 6, color: 'text-purple-500' },
  'Diplomacia': { key: 'charisma', label: 'CAR', order: 6, color: 'text-purple-500' },
  'Enganação': { key: 'charisma', label: 'CAR', order: 6, color: 'text-purple-500' },
  'Intimidação': { key: 'charisma', label: 'CAR', order: 6, color: 'text-purple-500' },
  'Vontade': { key: 'charisma', label: 'CAR', order: 6, color: 'text-purple-500' },
};

export function StatsColumn({ character, onSync, activePowers = [], deactivatePower }: StatsColumnProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSkills, setLocalSkills] = useState([...character.skills]);
  const [rollingAction, setRollingAction] = useState<{ 
    name: string; 
    modifier: number;
    initialApplyEfficiency?: boolean;
    efficiencyBonus?: number;
    modifierLabel?: string;
  } | null>(null);

  const activeFortalecer = obterBonusFortalecerAtivos(activePowers, character);

  const openModal = () => {
    setLocalSkills([...character.skills]);
    setIsModalOpen(true);
  };

  const handleUpdateSkill = (skillName: string, field: keyof typeof localSkills[0], value: any) => {
    setLocalSkills(prev => 
      prev.map(s => s.name === skillName ? { ...s, [field]: value } : s)
    );
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await onSync({ 
         skills: localSkills.map(s => ({
          name: s.name,
          state: s.proficiencyState,
          trainingBonus: s.trainingBonus,
          extraBonus: s.extraBonus,
        }))
      });
      setIsModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAttributeKeyForSkill = (skillName: string): keyof CharacterResponse['attributes'] => {
    if (skillName === 'Atletismo') return character.attributes.keyPhysical;
    if (skillName === 'Espiritismo') return character.attributes.keyMental;
    return SKILL_ATTRIBUTE_MAP[skillName]?.key || 'wisdom';
  };

  const getAttributeLabelForSkill = (skillName: string): { label: string, color: string } => {
    if (skillName === 'Atletismo') {
      const isStr = character.attributes.keyPhysical === 'strength';
      const isDex = character.attributes.keyPhysical === 'dexterity';
      return { 
        label: isStr ? 'FOR (CHV)' : isDex ? 'DES (CHV)' : 'CON (CHV)', 
        color: isStr ? 'text-red-500' : isDex ? 'text-orange-500' : 'text-yellow-500' 
      };
    }
    if (skillName === 'Espiritismo') {
      const isInt = character.attributes.keyMental === 'intelligence';
      const isWis = character.attributes.keyMental === 'wisdom';
      return { 
        label: isInt ? 'INT (CHV)' : isWis ? 'SAB (CHV)' : 'CAR (CHV)', 
        color: isInt ? 'text-blue-500' : isWis ? 'text-green-500' : 'text-purple-500' 
      };
    }
    return {
      label: SKILL_ATTRIBUTE_MAP[skillName]?.label || 'SAB',
      color: SKILL_ATTRIBUTE_MAP[skillName]?.color || 'text-green-500'
    };
  };

  const getSkillBonus = (skillName: string, skillsArray = character.skills, includeFortalecer = true) => {
    const skill = skillsArray.find(s => s.name === skillName);
    if (!skill) return 0;

    const attributeKey = getAttributeKeyForSkill(skillName);
    const attribute = character.attributes[attributeKey] as any;
    
    const attributeBonus = includeFortalecer ? (activeFortalecer.atributos[attributeKey] || 0) : 0;
    const attributeModifier = (attribute?.rollModifier || 0) + attributeBonus;
    
    const skillBonus = includeFortalecer ? (activeFortalecer.pericias[skillName] || 0) : 0;
    
    let bonus = skill.trainingBonus + (skill.extraBonus || 0) + attributeModifier + skillBonus;
    if (skill.proficiencyState === 'EFFICIENT') bonus += character.efficiencyBonus;
    if (skill.proficiencyState === 'INEFFICIENT') bonus -= Math.round(character.efficiencyBonus / 2);
    
    return bonus;
  };

  const handleRollSkill = (name: string) => {
    const skill = character.skills.find(s => s.name === name);
    if (!skill) return;

    const attributeKey = getAttributeKeyForSkill(name);
    const attribute = character.attributes[attributeKey] as any;
    
    const attributeBonus = activeFortalecer.atributos[attributeKey] || 0;
    const attrModifier = (attribute?.rollModifier || 0) + attributeBonus;
    
    const skillBonus = activeFortalecer.pericias[name] || 0;
    
    let baseModifier = attrModifier + skill.trainingBonus + (skill.extraBonus || 0) + skillBonus;

    const isInefficient = skill.proficiencyState === 'INEFFICIENT';
    if (isInefficient) {
      baseModifier -= Math.round(character.efficiencyBonus / 2);
    }

    setRollingAction({
      name: skill.name,
      modifier: baseModifier,
      initialApplyEfficiency: skill.proficiencyState === 'EFFICIENT',
      efficiencyBonus: isInefficient ? 0 : character.efficiencyBonus,
      modifierLabel: "Bônus Base"
    });
  };

  const handleRollAttribute = (type: 'physical' | 'mental') => {
    const key = type === 'physical' ? character.attributes.keyPhysical : character.attributes.keyMental;
    const attr = character.attributes[key] as any;
    
    const attributeBonus = activeFortalecer.atributos[key] || 0;
    const mod = (attr?.rollModifier || 0) + attributeBonus;
    
    setRollingAction({
      name: `Teste de Capacidade ${type === 'physical' ? 'Física' : 'Mental'}`,
      modifier: mod,
      initialApplyEfficiency: false,
      efficiencyBonus: 0,
      modifierLabel: "Mod. Atributo"
    });
  };

  const resistances = [
    { name: 'Fortitude', icon: <ShieldCheck className="w-4 h-4 text-red-500" />, attribute: 'CON' },
    { name: 'Reflexos', icon: <ShieldCheck className="w-4 h-4 text-orange-500" />, attribute: 'DES' },
    { name: 'Vontade', icon: <ShieldCheck className="w-4 h-4 text-purple-500" />, attribute: 'CAR' },
  ];

  const keyPhysicalAttr = character.attributes[character.attributes.keyPhysical] as any;
  const keyMentalAttr = character.attributes[character.attributes.keyMental] as any;

  const sortSkillsByAttribute = (a: { name: string }, b: { name: string }) => {
    const getOrder = (name: string) => {
      if (name === 'Atletismo') {
        const k = character.attributes.keyPhysical;
        return k === 'strength' ? 1 : k === 'dexterity' ? 2 : 3;
      }
      if (name === 'Espiritismo') {
        const k = character.attributes.keyMental;
        return k === 'intelligence' ? 4 : k === 'wisdom' ? 5 : 6;
      }
      return SKILL_ATTRIBUTE_MAP[name]?.order || 99;
    };
    
    const attrA = getOrder(a.name);
    const attrB = getOrder(b.name);
    if (attrA !== attrB) return attrA - attrB;
    return a.name.localeCompare(b.name);
  };

  const renderProficiencyIcon = (state: string, isRes: boolean = false) => {
    if (state === 'EFFICIENT') return <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0" title="Eficiente"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /></div>;
    if (state === 'INEFFICIENT') return <div className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center shrink-0" title="Ineficiente"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /></div>;
    if (isRes) return <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
    return <Circle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />;
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Atributos Chave */}
        <Card className="border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
              <Brain className="w-4 h-4 text-purple-500" />
              Capacidades Chave
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div 
              className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 cursor-pointer hover:border-red-500/50 transition-all active:scale-95 group"
              onClick={() => handleRollAttribute('physical')}
            >
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
                <Dumbbell className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Física ({character.attributes.keyPhysical === 'strength' ? 'FOR' : character.attributes.keyPhysical === 'dexterity' ? 'DES' : 'CON'})</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-red-900 dark:text-red-100 group-hover:text-red-600 transition-colors">
                  {keyPhysicalAttr.rollModifier >= 0 ? `+${keyPhysicalAttr.rollModifier}` : keyPhysicalAttr.rollModifier}
                </span>
                {(() => {
                  const bonus = activeFortalecer.atributos[character.attributes.keyPhysical] || 0;
                  return bonus > 0 && (
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400" title="Bônus Temporário de Fortalecer">
                      (+{bonus})
                    </span>
                  );
                })()}
                <Dices className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div 
              className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 cursor-pointer hover:border-blue-500/50 transition-all active:scale-95 group"
              onClick={() => handleRollAttribute('mental')}
            >
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
                <Brain className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Mental ({character.attributes.keyMental === 'intelligence' ? 'INT' : character.attributes.keyMental === 'wisdom' ? 'SAB' : 'CAR'})</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-blue-900 dark:text-blue-100 group-hover:text-blue-600 transition-colors">
                  {keyMentalAttr.rollModifier >= 0 ? `+${keyMentalAttr.rollModifier}` : keyMentalAttr.rollModifier}
                </span>
                {(() => {
                  const bonus = activeFortalecer.atributos[character.attributes.keyMental] || 0;
                  return bonus > 0 && (
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400" title="Bônus Temporário de Fortalecer">
                      (+{bonus})
                    </span>
                  );
                })()}
                <Dices className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resistências */}
        <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Resistências
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={openModal}>
              <Edit2 className="w-5 h-5 text-gray-400" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 py-2">
            {resistances.map((res) => {
              const skill = character.skills.find(s => s.name === res.name);
              const baseBonus = getSkillBonus(res.name, character.skills, false);
              const totalBonus = getSkillBonus(res.name, character.skills, true);
              const extra = skill?.extraBonus || 0;
              const baseDisplay = baseBonus - extra;
              const activeBonus = totalBonus - baseBonus;
              return (
                <div 
                  key={res.name} 
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:border-indigo-500/50 cursor-pointer transition-all active:scale-95 group"
                  onClick={() => handleRollSkill(res.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm group-hover:border-indigo-500 transition-colors">
                      {renderProficiencyIcon(skill?.proficiencyState || 'NEUTRAL', true)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{res.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium uppercase">{res.attribute}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        {baseDisplay >= 0 ? `+${baseDisplay}` : baseDisplay}
                      </span>
                      {activeBonus > 0 && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400" title="Bônus Temporário de Fortalecer">
                          (+{activeBonus})
                        </span>
                      )}
                      {extra > 0 && <span className="text-[10px] font-bold text-emerald-500">+{extra}</span>}
                    </div>
                    <Dices className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Lista de Perícias */}
        <Card className="border-none shadow-md bg-white dark:bg-gray-900 flex-1 min-h-0 flex flex-col">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
              <ListFilter className="w-4 h-4 text-emerald-500" />
              Perícias
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={openModal}>
                <Edit2 className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1 py-2">
            {character.skills
              .filter(s => !['Fortitude', 'Reflexos', 'Vontade'].includes(s.name))
              .sort(sortSkillsByAttribute)
              .map((skill) => {
                const baseBonus = getSkillBonus(skill.name, character.skills, false);
                const totalBonus = getSkillBonus(skill.name, character.skills, true);
                const extra = skill.extraBonus || 0;
                const baseDisplay = baseBonus - extra;
                const activeBonus = totalBonus - baseBonus;
                const isEfficient = skill.proficiencyState === 'EFFICIENT';
                const isInefficient = skill.proficiencyState === 'INEFFICIENT';
                const attrInfo = getAttributeLabelForSkill(skill.name);

                return (
                  <div 
                    key={skill.name} 
                    className="flex items-center justify-between p-2 rounded-lg text-sm border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-emerald-500/20 cursor-pointer transition-all active:scale-[0.98] group"
                    onClick={() => handleRollSkill(skill.name)}
                  >
                    <div className="flex items-center gap-2">
                      {renderProficiencyIcon(skill.proficiencyState)}
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-emerald-500 transition-colors">{skill.name}</span>
                        {attrInfo && (
                          <span className={`text-[9px] font-black uppercase ${attrInfo.color} opacity-70`}>
                            {attrInfo.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-black ${isEfficient ? 'text-emerald-600' : isInefficient ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                          {baseDisplay >= 0 ? `+${baseDisplay}` : baseDisplay}
                        </span>
                        {activeBonus > 0 && (
                          <span className="text-[9px] font-black text-amber-600 dark:text-amber-400" title="Bônus Temporário de Fortalecer">
                            (+{activeBonus})
                          </span>
                        )}
                        {extra > 0 && <span className="text-[9px] font-bold text-emerald-500">+{extra}</span>}
                      </div>
                      <Dices className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <DiceRoller
        isOpen={!!rollingAction}
        onClose={() => setRollingAction(null)}
        label={rollingAction?.name || ''}
        modifier={rollingAction?.modifier || 0}
        efficiencyBonus={rollingAction?.efficiencyBonus}
        initialApplyEfficiency={rollingAction?.initialApplyEfficiency}
        modifierLabel={rollingAction?.modifierLabel}
        onRoll={() => {
          if (rollingAction && deactivatePower) {
            const rolledName = rollingAction.name;
            let rolledAttrKey = '';
            if (rolledName.startsWith('Teste de Capacidade')) {
              rolledAttrKey = rolledName.includes('Física')
                ? character.attributes.keyPhysical
                : character.attributes.keyMental;
            } else {
              rolledAttrKey = getAttributeKeyForSkill(rolledName);
            }

            for (const ap of activePowers) {
              if (ap.duracao === 0 && ap.efeitos) {
                let matches = false;
                for (const ef of ap.efeitos) {
                  const baseId = ef.efeitoBaseId || ef.effectBaseId || ef.id;
                  if (baseId !== 'fortalecer') continue;
                  const val = ef.inputCustomizado || ef.inputValue || ef.value;
                  if (!val) continue;
                  try {
                    const alocs = JSON.parse(String(val));
                    if (Array.isArray(alocs)) {
                      for (const aloc of alocs) {
                        if (aloc.tipo === 'pericia' && aloc.alvo === rolledName) {
                          matches = true;
                        } else if (aloc.tipo === 'atributo' && aloc.alvo === rolledAttrKey) {
                          matches = true;
                        }
                      }
                    }
                  } catch {}
                }
                if (matches) {
                  deactivatePower(ap.id);
                }
              }
            }
          }
        }}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gerenciar Perícias & Resistências" size="xl">
        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          
          {/* Header da Tabela */}
          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
            <div className="col-span-4">Nome & Atributo</div>
            <div className="col-span-3 text-center">Eficiência</div>
            <div className="col-span-2 text-center" title="Bônus de Treinamento">Treino</div>
            <div className="col-span-2 text-center" title="Bônus Extra (Itens/Poderes)">Extra</div>
            <div className="col-span-1 text-right">Total</div>
          </div>

          <div className="space-y-1">
            {localSkills.sort(sortSkillsByAttribute).map(skill => {
              const total = getSkillBonus(skill.name, localSkills);
              const isRes = ['Fortitude', 'Reflexos', 'Vontade'].includes(skill.name);
              const attrInfo = getAttributeLabelForSkill(skill.name);
              
              return (
                <div key={skill.name} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border ${isRes ? 'bg-indigo-50/30 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/20' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                  <div className="col-span-4 flex items-center gap-2">
                    {renderProficiencyIcon(skill.proficiencyState, isRes)}
                    <div>
                      <p className={`text-sm font-bold leading-none ${isRes ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>{skill.name}</p>
                      {attrInfo && (
                        <p className={`text-[10px] font-black uppercase mt-0.5 ${attrInfo.color} opacity-80`}>
                          {attrInfo.label}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <Select 
                      value={skill.proficiencyState}
                      onChange={(e) => handleUpdateSkill(skill.name, 'proficiencyState', e.target.value)}
                      className={`h-8 text-xs font-bold ${
                        skill.proficiencyState === 'EFFICIENT' ? 'text-emerald-600' : 
                        skill.proficiencyState === 'INEFFICIENT' ? 'text-red-600' : ''
                      }`}
                      options={[
                        { value: 'EFFICIENT', label: 'Eficiente' },
                        { value: 'NEUTRAL', label: 'Neutro' },
                        { value: 'INEFFICIENT', label: 'Ineficiente' },
                      ]}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      min="0"
                      value={skill.trainingBonus} 
                      onChange={(e) => handleUpdateSkill(skill.name, 'trainingBonus', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs text-center"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      value={skill.extraBonus || 0} 
                      onChange={(e) => handleUpdateSkill(skill.name, 'extraBonus', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs text-center text-emerald-600 dark:text-emerald-400 font-bold"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <span className={`text-lg font-black ${total >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                      {total >= 0 ? `+${total}` : total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} loading={isProcessing}>Salvar Perícias</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
