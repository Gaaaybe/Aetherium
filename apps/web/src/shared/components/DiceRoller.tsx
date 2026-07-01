import { useState, useEffect } from 'react';
import { Dices, Zap, Target, Sparkles, RotateCcw, Plus } from 'lucide-react';
import { Button, Modal, Badge, ModalFooter } from '../ui';
import { rollD20, rollDamage, type RollResult } from '../utils/diceRoller';

interface DiceRollerProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  modifier: number;
  damageFormula?: string;
  damageModifier?: number;
  modifierLabel?: string;
  rollButtonLabel?: string;
  critMargin?: number;
  critMultiplier?: number;
  efficiencyBonus?: number;
  initialApplyEfficiency?: boolean;
  isModular?: boolean;
  referenceCDs?: { label: string; value: number }[];
  onlyDamage?: boolean;
}

export function DiceRoller({ 
  isOpen,
  onClose,
  label, 
  modifier, 
  damageFormula = '', 
  damageModifier = 0, 
  modifierLabel = "Modificador",
  rollButtonLabel = "Rolar Teste",
  critMargin = 20,
  critMultiplier = 2,
  efficiencyBonus = 0,
  initialApplyEfficiency = false,
  isModular = false,
  referenceCDs = [],
  onlyDamage = false,
}: DiceRollerProps) {
  const [attackRoll, setAttackRoll] = useState<(RollResult & { efficiency?: number, manual?: number }) | null>(null);
  const [damageRoll, setDamageRoll] = useState<{ total: number; rolls: number[]; modifier: number; multiplier: number } | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  
  const [extraDice, setExtraDice] = useState(0);
  const [rule, setRule] = useState<'advantage' | 'disadvantage' | 'normal'>('normal');

  const [applyEfficiency, setApplyEfficiency] = useState(initialApplyEfficiency);
  const [manualModifier, setManualModifier] = useState(0);
  const [manualDamageModifier, setManualDamageModifier] = useState(0);

  // Estados locais para modo modular
  const [localFormula, setLocalFormula] = useState(damageFormula);
  const [localDamageMod, setLocalDamageMod] = useState(damageModifier);

  const currentTotalModifier = modifier + (applyEfficiency ? efficiencyBonus : 0) + manualModifier;

  useEffect(() => {
    if (isOpen) {
      setAttackRoll(null);
      setDamageRoll(null);
      setApplyEfficiency(initialApplyEfficiency);
      setManualModifier(0);
      setManualDamageModifier(0);
      setLocalFormula(damageFormula);
      setLocalDamageMod(damageModifier);
    }
  }, [isOpen, initialApplyEfficiency, label, damageFormula, damageModifier]);

  const handleRollAttack = () => {
    setIsRolling(true);
    setTimeout(() => {
      const result = rollD20(currentTotalModifier, rule === 'normal' ? 0 : extraDice, rule, critMargin);
      
      setAttackRoll({
        ...result,
        efficiency: applyEfficiency ? efficiencyBonus : undefined,
        manual: manualModifier !== 0 ? manualModifier : undefined
      });
      setIsRolling(false);
    }, 400);
  };

  const handleRollDamage = () => {
    const formulaToUse = isModular ? localFormula : damageFormula;
    if (!formulaToUse) return;
    
    setIsRolling(true);
    const multiplier = attackRoll?.isCritical ? critMultiplier : 1;
    const bonusToUse = (isModular ? localDamageMod : damageModifier) + manualDamageModifier;
    
    setTimeout(() => {
      const result = rollDamage(formulaToUse);
      const baseTotalWithBonus = result.total + bonusToUse; 
      const finalTotal = baseTotalWithBonus * multiplier;
      
      setDamageRoll({
        ...result,
        total: finalTotal,
        modifier: result.modifier + bonusToUse,
        multiplier
      });
      setIsRolling(false);
    }, 400);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={label} size="sm">
      <div className="space-y-6 py-2">
        {/* CDs de Referência (Apenas Modo Modular) */}
        {isModular && referenceCDs.length > 0 && (
          <div className="flex gap-2 justify-center">
            {referenceCDs.map((cd, i) => (
              <div key={i} className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 text-center min-w-[80px]">
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{cd.label}</p>
                <p className="text-sm font-black text-indigo-900 dark:text-indigo-100 italic">{cd.value}</p>
              </div>
            ))}
          </div>
        )}

        {!onlyDamage && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
             {efficiencyBonus > 0 && (
               <div className="flex items-center gap-2">
                 <input 
                   id="applyEfficiency"
                   type="checkbox" 
                   checked={applyEfficiency} 
                   onChange={(e) => setApplyEfficiency(e.target.checked)}
                   className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                 />
                 <label htmlFor="applyEfficiency" className="text-[10px] font-black uppercase text-gray-500 cursor-pointer select-none">
                   Eficiência (+{efficiencyBonus})
                 </label>
               </div>
             )}
             <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">Teste Extra:</span>
                <input 
                  type="number" 
                  value={manualModifier || ''} 
                  placeholder="0"
                  onChange={(e) => setManualModifier(parseInt(e.target.value) || 0)}
                  className="w-full h-6 text-center text-xs font-black bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                />
             </div>
             {(damageFormula || isModular) && (
               <div className="flex items-center gap-2 px-1 col-span-2 border-t border-dashed border-gray-200 dark:border-gray-700 pt-2 mt-1">
                  <span className="text-[10px] font-black uppercase text-amber-500 whitespace-nowrap">Dano/Cura Extra:</span>
                  <input 
                    type="number" 
                    value={manualDamageModifier || ''} 
                    placeholder="0"
                    onChange={(e) => setManualDamageModifier(parseInt(e.target.value) || 0)}
                    className="w-full h-6 text-center text-xs font-black bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded focus:ring-1 focus:ring-amber-500 outline-none text-amber-600 dark:text-amber-400"
                  />
               </div>
             )}
          </div>
        )}

        {/* Configurações Modulares de Efeito */}
        {isModular && (
          <div className="p-3 bg-amber-50/30 dark:bg-amber-900/10 rounded-xl border border-amber-100/50 dark:border-amber-900/30 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-1">Fórmula de Dado</label>
                <div className="flex items-center bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded-lg p-1 px-2 gap-2 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <input 
                    type="text" 
                    value={localFormula}
                    onChange={(e) => setLocalFormula(e.target.value)}
                    placeholder="Ex: 2d10"
                    className="w-full bg-transparent text-sm font-black text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>
              <div className="w-24 space-y-1 text-right">
                <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-1">Soma Fixo</label>
                <div className="flex items-center bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded-lg p-1 px-2 gap-2 shadow-sm">
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <input 
                    type="number" 
                    value={localDamageMod || ''}
                    onChange={(e) => setLocalDamageMod(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-transparent text-sm font-black text-gray-900 dark:text-white outline-none text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!onlyDamage && (
          <div className="space-y-3">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-bold">
              {(['disadvantage', 'normal', 'advantage'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRule(r)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    rule === r 
                      ? (r === 'advantage' ? 'bg-emerald-500 text-white shadow-sm' : r === 'disadvantage' ? 'bg-red-500 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm')
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {r === 'advantage' ? 'Vantagem' : r === 'disadvantage' ? 'Desvantagem' : 'Normal'}
                </button>
              ))}
            </div>

            {rule !== 'normal' && (
              <div className="flex items-center justify-between px-2 animate-in slide-in-from-top-2 duration-200">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Dados Extras (+{extraDice})</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setExtraDice(num)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${
                        extraDice === num 
                          ? 'bg-indigo-500 border-indigo-600 text-white' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!onlyDamage && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 shadow-inner">
             <div className="flex flex-col items-center">
               <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{modifierLabel}</span>
               <span className="text-sm font-black text-gray-500">{modifier >= 0 ? `+${modifier}` : modifier}</span>
             </div>
             
             <div className="flex flex-col items-center px-4 py-1.5 bg-white dark:bg-gray-900 rounded-lg border border-indigo-100 dark:border-indigo-900 shadow-sm scale-110">
               <span className="text-[9px] uppercase font-black text-indigo-500 tracking-widest mb-0.5">Bônus Total</span>
               <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 transition-all">
                 {currentTotalModifier >= 0 ? `+${currentTotalModifier}` : currentTotalModifier}
               </span>
             </div>

             <div className="flex flex-col items-center">
               <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Crítico</span>
               <Badge variant="secondary" className="font-black text-[10px] h-5">{critMargin}+ / x{critMultiplier}</Badge>
             </div>
          </div>
        )}

        {onlyDamage && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/30 shadow-inner">
               <div className="flex flex-col items-center">
                 <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest">Fórmula</span>
                 <span className="text-sm font-black text-gray-500 dark:text-gray-400">{damageFormula}</span>
               </div>
               {damageModifier !== 0 && (
                 <div className="flex flex-col items-center">
                   <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest">Bônus</span>
                   <span className="text-sm font-black text-gray-500 dark:text-gray-400">{damageModifier >= 0 ? `+${damageModifier}` : damageModifier}</span>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-amber-200 dark:border-amber-900/50">
               <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-[10px] font-black uppercase text-amber-500 whitespace-nowrap">Dano/Cura Extra:</span>
                  <input 
                    type="number" 
                    value={manualDamageModifier || ''} 
                    placeholder="0"
                    onChange={(e) => setManualDamageModifier(parseInt(e.target.value) || 0)}
                    className="w-24 h-6 text-center text-xs font-black bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/50 rounded focus:ring-1 focus:ring-amber-500 outline-none text-amber-600 dark:text-amber-400"
                  />
               </div>
            </div>
          </div>
        )}

        <div className="min-h-[140px] flex flex-col gap-4">
          {!attackRoll && !damageRoll && !isRolling && (
            <div className="flex-1 min-h-[140px] flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
              <Dices className="w-8 h-8 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-tighter">
                {onlyDamage ? 'Aguardando Rolagem de Dano...' : 'Aguardando Rolagem...'}
              </p>
            </div>
          )}

          {isRolling && (
             <div className="flex-1 flex flex-col items-center justify-center gap-3">
               <div className="relative">
                 <Dices className="w-12 h-12 text-indigo-500 animate-bounce" />
                 <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-500 animate-pulse" />
               </div>
               <p className="text-sm font-black text-indigo-600 animate-pulse uppercase tracking-widest">
                 {onlyDamage ? 'Rolando Dano...' : `Rolando ${rule !== 'normal' ? 1 + extraDice : 1} Dados...`}
               </p>
             </div>
          )}

          {attackRoll && !isRolling && (
            <div className={`p-4 rounded-2xl border-2 transition-all shadow-lg ${
              attackRoll.isCritical 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-emerald-500/10' 
                : attackRoll.isFumble 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500 shadow-red-500/10'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-indigo-500/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={attackRoll.isCritical ? 'success' : attackRoll.isFumble ? 'caos' : 'info'} className="text-[10px] font-black uppercase">
                   {attackRoll.isCritical ? 'Sucesso Crítico!' : attackRoll.isFumble ? 'Falha Crítica!' : 'Resultado'}
                </Badge>
                <Target className={`w-4 h-4 ${attackRoll.isCritical ? 'text-emerald-500' : attackRoll.isFumble ? 'text-red-500' : 'text-indigo-500'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900 dark:text-white leading-none">{attackRoll.total}</span>
                <span className="text-[10px] font-bold text-gray-500 italic">
                  ( 🎲 {attackRoll.d20} + {modifier}Atrib 
                  {attackRoll.efficiency ? ` + ${attackRoll.efficiency}Efic` : ''} 
                  {attackRoll.manual ? ` + ${attackRoll.manual}Extra` : ''} )
                </span>
              </div>
              {attackRoll.allRolls.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-1.5 py-2 border-t border-black/5 dark:border-white/5">
                  {attackRoll.allRolls.map((val, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        val === attackRoll.d20 
                          ? 'bg-indigo-500 text-white shadow-sm scale-110' 
                          : 'bg-white/50 dark:bg-black/20 text-gray-400 line-through decoration-red-500/50'
                      }`}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {damageRoll && !isRolling && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 shadow-lg shadow-amber-500/10 animate-in zoom-in-95 duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className="bg-amber-500 text-white border-none text-[10px] font-black uppercase">Dano Causado</Badge>
                  {damageRoll.multiplier > 1 && (
                    <Badge className="bg-red-500 text-white border-none text-[10px] font-black uppercase">x{damageRoll.multiplier} Crítico!</Badge>
                  )}
                </div>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-600 leading-none">💥 {damageRoll.total}</span>
                <span className="text-xs font-bold text-amber-700/60">
                  Dados: [{damageRoll.rolls.join(', ')}] {damageRoll.modifier !== 0 ? `${damageRoll.modifier >= 0 ? '+' : ''}${damageRoll.modifier}` : ''}
                  {damageRoll.multiplier > 1 ? ` x ${damageRoll.multiplier}` : ''}
                </span>
              </div>
              <div className="pt-2 border-t border-dashed border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs font-bold text-amber-700/80 dark:text-amber-400">
                <span>Dano Parcial (Metade):</span>
                <span className="font-black text-amber-600 dark:text-amber-300">💥 {Math.floor(damageRoll.total / 2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {onlyDamage ? (
            <Button
              onClick={handleRollDamage}
              disabled={isRolling}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black h-12 rounded-xl shadow-lg shadow-amber-500/20 gap-2"
            >
              <Zap className="w-5 h-5" /> {damageRoll ? 'Rolar Novamente' : (rollButtonLabel || 'Rolar Dano')}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleRollAttack}
                disabled={isRolling}
                className={`flex-1 font-black h-12 rounded-xl shadow-lg gap-2 transition-all ${
                  rule === 'advantage' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 
                  rule === 'disadvantage' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 
                  'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                } text-white`}
              >
                <Dices className="w-5 h-5" />
                {attackRoll ? 'Rolar Novamente' : rollButtonLabel}
              </Button>
              
              {(isModular || damageFormula) && attackRoll && !isRolling && (
                <Button
                  onClick={handleRollDamage}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black h-12 rounded-xl shadow-lg shadow-amber-500/20 gap-2 animate-in slide-in-from-left-4"
                >
                  <Zap className="w-5 h-5" /> {isModular ? 'Rolar Efeito' : 'Rolar Dano'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <ModalFooter className="justify-center border-none pt-0">
        {(attackRoll || damageRoll) && (
          <Button
            variant="ghost"
            onClick={() => { setAttackRoll(null); setDamageRoll(null); }}
            size="sm"
            className="text-gray-400 hover:text-gray-600 gap-1 font-bold italic"
          >
            <RotateCcw className="w-3 h-3" /> Limpar Dados
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
