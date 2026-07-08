import { useState } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, ModalFooter, Input, Select } from '@/shared/ui';
import { Activity, Edit2, Shield, Brain, Plus, Minus, Info, Dices } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { DiceRoller } from '@/shared/components/DiceRoller';
import { obterBonusFortalecerAtivos } from '@/features/ficha-personagem/utils/fortalecerHelper';
import { getRollAdvantageDisadvantage } from '@aetherium/rules-engine';

interface AttributeCardProps {
  character: CharacterResponse;
  onSync: (data: SyncCharacterData) => Promise<void>;
  activePowers?: any[];
}

export function AttributeCard({ character, onSync, activePowers }: AttributeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rollingAttribute, setRollingAttribute] = useState<{
    label: string;
    modifier: number;
    initialRule?: 'advantage' | 'disadvantage' | 'normal';
    initialExtraDice?: number;
  } | null>(null);

  const { attributes, level } = character;
  const activeFortalecer = obterBonusFortalecerAtivos(activePowers || [], character);

  const items = [
    { key: 'strength', label: 'FOR', attr: attributes.strength, color: 'text-red-500', bg: 'bg-red-500/10' },
    { key: 'dexterity', label: 'DES', attr: attributes.dexterity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { key: 'constitution', label: 'CON', attr: attributes.constitution, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { key: 'intelligence', label: 'INT', attr: attributes.intelligence, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { key: 'wisdom', label: 'SAB', attr: attributes.wisdom, color: 'text-green-500', bg: 'bg-green-500/10' },
    { key: 'charisma', label: 'CAR', attr: attributes.charisma, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const radarData = items.map((item) => {
    const tempBonus = activeFortalecer.atributos[item.key] || 0;
    return {
      subject: item.label,
      A: item.attr.baseModifier + item.attr.extraBonus + tempBonus,
    };
  });

  const [localAttributes, setLocalAttributes] = useState({
    strength: { baseValue: attributes.strength.baseValue, extraBonus: attributes.strength.extraBonus },
    dexterity: { baseValue: attributes.dexterity.baseValue, extraBonus: attributes.dexterity.extraBonus },
    constitution: { baseValue: attributes.constitution.baseValue, extraBonus: attributes.constitution.extraBonus },
    intelligence: { baseValue: attributes.intelligence.baseValue, extraBonus: attributes.intelligence.extraBonus },
    wisdom: { baseValue: attributes.wisdom.baseValue, extraBonus: attributes.wisdom.extraBonus },
    charisma: { baseValue: attributes.charisma.baseValue, extraBonus: attributes.charisma.extraBonus },
    keyPhysical: attributes.keyPhysical,
    keyMental: attributes.keyMental,
  });

  const totalSpent = 
    localAttributes.strength.baseValue +
    localAttributes.dexterity.baseValue +
    localAttributes.constitution.baseValue +
    localAttributes.intelligence.baseValue +
    localAttributes.wisdom.baseValue +
    localAttributes.charisma.baseValue;

  const allowedPoints = 67 + (level * (level + 1)) / 2;
  const remainingPoints = allowedPoints - totalSpent;

  const handleUpdateBase = (key: keyof typeof localAttributes, delta: number) => {
    if (typeof localAttributes[key] === 'string') return;
    const attr = localAttributes[key] as { baseValue: number; extraBonus: number };
    const newValue = Math.max(0, attr.baseValue + delta);
    setLocalAttributes({ ...localAttributes, [key]: { ...attr, baseValue: newValue } });
  };

  const handleUpdateExtra = (key: keyof typeof localAttributes, value: string) => {
    if (typeof localAttributes[key] === 'string') return;
    const attr = localAttributes[key] as { baseValue: number; extraBonus: number };
    const newValue = parseInt(value) || 0;
    setLocalAttributes({ ...localAttributes, [key]: { ...attr, extraBonus: newValue } });
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await onSync({ attributes: localAttributes });
      setIsModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-purple-500" />
            Atributos
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setIsModalOpen(true)}>
            <Edit2 className="w-5 h-5 text-gray-400" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full relative flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[(dataMin: number) => Math.min(dataMin, -5), (dataMax: number) => Math.max(dataMax, 100)]}
                  tick={false} 
                  axisLine={false} 
                />
                <Radar
                  name="Atributos"
                  dataKey="A"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {items.map((item) => {
              const tempBonus = activeFortalecer.atributos[item.key] || 0;
              const labelMap: Record<string, string> = {
                strength: 'Força',
                dexterity: 'Destreza',
                constitution: 'Constituição',
                intelligence: 'Inteligência',
                wisdom: 'Sabedoria',
                charisma: 'Carisma',
              };
              return (
                <button 
                  key={item.label} 
                  onClick={() => {
                  const { rule, extraDice } = getRollAdvantageDisadvantage(character, 'attribute', {
                    attributeKey: item.key
                  });
                  setRollingAttribute({ 
                    label: labelMap[item.key] || 'Atributo', 
                    modifier: item.attr.baseModifier + item.attr.extraBonus + tempBonus,
                    initialRule: rule,
                    initialExtraDice: extraDice
                  });
                }}
                  className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 group relative overflow-hidden transition-all hover:border-indigo-500/50 hover:bg-indigo-50/10 active:scale-95"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${item.bg}`} />
                  <span className={`text-[10px] font-bold ${item.color}`}>{item.label}</span>
                  <div className="flex items-baseline gap-0.5 mt-1">
                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                      {item.attr.baseModifier >= 0 ? `+${item.attr.baseModifier}` : item.attr.baseModifier}
                    </span>
                    {item.attr.extraBonus > 0 && (
                      <span className="text-[10px] font-bold text-emerald-500" title="Bônus Extra (Itens/Poderes)">
                        +{item.attr.extraBonus}
                      </span>
                    )}
                    {item.attr.extraBonus < 0 && (
                      <span className="text-[10px] font-bold text-red-500" title="Penalidade">
                        {item.attr.extraBonus}
                      </span>
                    )}
                    {tempBonus > 0 && (
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 ml-0.5" title="Bônus Temporário de Fortalecer">
                        (+{tempBonus})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold mt-1">
                    Base: {item.attr.baseValue}
                  </span>
                  <Dices className="absolute -right-1 -bottom-1 w-6 h-6 opacity-0 group-hover:opacity-10 transition-opacity text-indigo-500" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Roller de Atributo */}
      {rollingAttribute && (
        <DiceRoller
          isOpen={!!rollingAttribute}
          onClose={() => setRollingAttribute(null)}
          label={`Teste de ${rollingAttribute.label}`}
          modifier={rollingAttribute.modifier}
          modifierLabel="Bônus de Atributo"
          initialRule={rollingAttribute.initialRule}
          initialExtraDice={rollingAttribute.initialExtraDice}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gerenciar Atributos" size="lg">
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30">
            <div>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">Pontos Disponíveis (NV {level})</p>
              <p className="text-2xl font-black text-purple-900 dark:text-white leading-none mt-1">
                {remainingPoints} <span className="text-sm font-medium text-gray-400">/ {allowedPoints}</span>
              </p>
            </div>
            <Info className="w-6 h-6 text-purple-400 opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {items.map((item) => {
              const localAttr = localAttributes[item.key as keyof typeof localAttributes] as { baseValue: number; extraBonus: number };
              return (
                <div key={item.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center font-bold ${item.color}`}>
                        {item.label}
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        {item.key === 'strength' ? 'Força' : 
                         item.key === 'dexterity' ? 'Destreza' : 
                         item.key === 'constitution' ? 'Constituição' : 
                         item.key === 'intelligence' ? 'Inteligência' : 
                         item.key === 'wisdom' ? 'Sabedoria' : 'Carisma'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleUpdateBase(item.key as any, -1)}>
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-lg font-black w-6 text-center">{localAttr.baseValue}</span>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleUpdateBase(item.key as any, 1)} disabled={remainingPoints <= 0}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-10">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Bônus Extra (Itens/Poderes)</p>
                      <Input 
                        type="number" 
                        className="h-8 text-xs" 
                        value={localAttr.extraBonus} 
                        onChange={(e) => handleUpdateExtra(item.key as any, e.target.value)}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Modificador Final</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {Math.ceil((localAttr.baseValue - 10) / 2) + localAttr.extraBonus >= 0 ? '+' : ''}
                        {Math.ceil((localAttr.baseValue - 10) / 2) + localAttr.extraBonus}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-red-500" /> Atributo Chave Físico
              </label>
              <Select 
                value={localAttributes.keyPhysical}
                onChange={(e) => setLocalAttributes({ ...localAttributes, keyPhysical: e.target.value as any })}
                options={[
                  { value: 'strength', label: 'Força' },
                  { value: 'dexterity', label: 'Destreza' },
                  { value: 'constitution', label: 'Constituição' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-blue-500" /> Atributo Chave Mental
              </label>
              <Select 
                value={localAttributes.keyMental}
                onChange={(e) => setLocalAttributes({ ...localAttributes, keyMental: e.target.value as any })}
                options={[
                  { value: 'intelligence', label: 'Inteligência' },
                  { value: 'wisdom', label: 'Sabedoria' },
                  { value: 'charisma', label: 'Carisma' },
                ]}
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} loading={isProcessing} disabled={remainingPoints < 0}>
            Salvar Atributos
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
