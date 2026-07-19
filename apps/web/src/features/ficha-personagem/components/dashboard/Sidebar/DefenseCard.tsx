import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardContent } from '@/shared/ui';
import { Shield, Swords, ShieldAlert, Dices, ShieldCheck, Zap } from 'lucide-react';
import { DiceRoller } from '@/shared/components/DiceRoller';
import { obterBonusFortalecerRD, obterBonusFortalecerDanoRecuperacao, obterBonusFortalecerCaracteristicasDesarmado, obterBonusFortalecerCaracteristicasItem } from '@/features/ficha-personagem/utils/fortalecerHelper';
import { obterGrauBeneficio, isArmaDistancia, isArmaCorpoACorpo, obterReducaoCriticoParaArma } from '@/features/ficha-personagem/utils/benefitsHelper';
import { getItemById } from '@/services/items.service';
import { toast } from '@/shared/ui';
import { getRollAdvantageDisadvantage, hasConditionEffectOf } from '@aetherium/rules-engine';


interface DefenseCardProps {
  character: CharacterResponse;
  activePowers?: any[];
  onSync?: (data: SyncCharacterData) => Promise<void>;
}

// --- Popup rendered via portal to escape overflow:hidden ---
function DamageCalcPortal({
  anchorRef,
  title,
  icon,
  rdTotal,
  halveDamage,
  doubleDamage,
  accentColor,
  onApply,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  icon: React.ReactNode;
  rdTotal: number;
  halveDamage: boolean;
  doubleDamage: boolean;
  accentColor: 'orange' | 'purple' | 'red';
  onApply: (dano: number) => void;
  onClose: () => void;
}) {
  const [rawDamage, setRawDamage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const [shouldHalve, setShouldHalve] = useState(halveDamage);
  const [shouldDouble, setShouldDouble] = useState(doubleDamage);
  const [shouldSuscetivel, setShouldSuscetivel] = useState(false);

  // Sync state if props change (e.g. switching between block/resist or condition changes)
  useEffect(() => {
    setShouldHalve(halveDamage);
  }, [halveDamage]);

  useEffect(() => {
    setShouldDouble(doubleDamage);
  }, [doubleDamage]);

  // Focus input on open
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Calculate position from anchor (fixed = viewport coords, no scroll offset)
  const calcPos = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popupWidth = Math.max(rect.width, 255);
    const leftRaw = rect.left;
    // Clamp so popup doesn't overflow right edge
    const left = Math.min(leftRaw, window.innerWidth - popupWidth - 8);
    setPos({ top: rect.bottom + 6, left: Math.max(8, left), width: popupWidth });
  }, [anchorRef]);

  useEffect(() => {
    calcPos();
    window.addEventListener('resize', calcPos);
    window.addEventListener('scroll', calcPos, true);
    return () => {
      window.removeEventListener('resize', calcPos);
      window.removeEventListener('scroll', calcPos, true);
    };
  }, [calcPos]);

  const raw = parseInt(rawDamage) || 0;
  const afterHalve = shouldHalve ? Math.floor(raw / 2) : raw;
  const afterDouble = shouldDouble ? afterHalve * 2 : afterHalve;
  const afterSuscetivel = shouldSuscetivel ? afterDouble * 2 : afterDouble;
  const finalDamage = Math.max(0, afterSuscetivel - rdTotal);

  const handleApply = () => {
    if (raw > 0) onApply(finalDamage);
    onClose();
  };

  const borderMap = {
    orange: 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950',
    purple: 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-950',
    red: 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950',
  };
  const ringMap = {
    orange: 'focus:ring-orange-400',
    purple: 'focus:ring-purple-400',
    red: 'focus:ring-red-400',
  };

  const borderColor = borderMap[accentColor];
  const ringColor = ringMap[accentColor];

  if (!pos) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Popup */}
      <div
        className={`fixed z-[999] rounded-xl border-2 shadow-2xl p-3 space-y-2 ${borderColor}`}
        style={{ top: pos.top, left: pos.left, width: pos.width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-tight text-gray-700 dark:text-gray-200">
            {icon}
            {title}
          </div>
          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none">
            Suporta Vulnerabilidade e Suscetibilidade
          </span>
        </div>

        <input
          ref={inputRef}
          type="number"
          min="0"
          value={rawDamage}
          onChange={(e) => setRawDamage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApply();
            if (e.key === 'Escape') onClose();
          }}
          placeholder="Dano recebido..."
          className={`w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 dark:text-white ${ringColor}`}
        />

        {/* Checkboxes for multipliers */}
        <div className="flex gap-1.5 justify-between py-1 border-t border-b border-gray-200/50 dark:border-gray-800/50 my-1">
          <label className="flex items-center gap-0.5 text-[8px] font-black uppercase text-gray-500 dark:text-gray-400 cursor-pointer select-none" title="Dano reduzido pela metade">
            <input
              type="checkbox"
              checked={shouldHalve}
              onChange={(e) => setShouldHalve(e.target.checked)}
              className="rounded text-purple-600 border-gray-300 dark:border-gray-700 focus:ring-purple-500 w-3 h-3"
            />
            Metade (Resist)
          </label>
          <label className="flex items-center gap-0.5 text-[8px] font-black uppercase text-gray-500 dark:text-gray-400 cursor-pointer select-none" title="Dano multiplicado por 2 (Vulnerabilidade/Fatigado/Exausto)">
            <input
              type="checkbox"
              checked={shouldDouble}
              onChange={(e) => setShouldDouble(e.target.checked)}
              className="rounded text-red-600 border-gray-300 dark:border-gray-700 focus:ring-red-500 w-3 h-3"
            />
            x2 (Vulner.)
          </label>
          <label className="flex items-center gap-0.5 text-[8px] font-black uppercase text-gray-500 dark:text-gray-400 cursor-pointer select-none" title="Dano multiplicado por 2 cumulativamente (Suscetibilidade)">
            <input
              type="checkbox"
              checked={shouldSuscetivel}
              onChange={(e) => setShouldSuscetivel(e.target.checked)}
              className="rounded text-amber-600 border-gray-300 dark:border-gray-700 focus:ring-amber-500 w-3 h-3"
            />
            x2 (Suscet.)
          </label>
        </div>

        {raw > 0 && (
          <div className="text-[10px] space-y-0.5 text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-black/30 rounded p-1.5">
            {shouldHalve && (
              <div className="flex justify-between">
                <span>Metade do dano:</span>
                <span className="font-bold">{afterHalve}</span>
              </div>
            )}
            {shouldDouble && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Dano duplicado (Vulnerável):</span>
                <span className="font-black">{afterDouble}</span>
              </div>
            )}
            {shouldSuscetivel && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Dano duplicado (Suscetível):</span>
                <span className="font-black">{afterSuscetivel}</span>
              </div>
            )}
            {rdTotal > 0 && (
              <div className="flex justify-between">
                <span>RD absorvida:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  -{Math.min(afterSuscetivel, rdTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-0.5 mt-0.5">
              <span className="font-black">Dano final:</span>
              <span className={`font-black text-sm ${finalDamage === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {finalDamage}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={onClose}
            className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={raw <= 0}
            className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Aplicar Dano
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

function ParryPortal({
  anchorRef,
  character,
  handsDetails,
  activePowers,
  onClose,
  onRoll,
  onFail,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  character: CharacterResponse;
  handsDetails: Record<string, any>;
  activePowers?: any[];
  onClose: () => void;
  onRoll: (config: {
    label: string;
    modifier: number;
    damageFormula?: string;
    damageModifier?: number;
    critMargin?: number;
    critMultiplier?: number;
    efficiencyBonus?: number;
    initialApplyEfficiency?: boolean;
    initialRule?: 'advantage' | 'disadvantage' | 'normal';
    initialExtraDice?: number;
  }) => void;
  onFail: () => Promise<void>;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const calcPos = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popupWidth = Math.max(rect.width, 240);
    const leftRaw = rect.left;
    const left = Math.min(leftRaw, window.innerWidth - popupWidth - 8);
    setPos({ top: rect.bottom + 6, left: Math.max(8, left), width: popupWidth });
  }, [anchorRef]);

  useEffect(() => {
    calcPos();
    window.addEventListener('resize', calcPos);
    window.addEventListener('scroll', calcPos, true);
    return () => {
      window.removeEventListener('resize', calcPos);
      window.removeEventListener('scroll', calcPos, true);
    };
  }, [calcPos]);

  if (!pos) return null;

  // Opções de ataque
  const keyPhysical = character.attributes?.keyPhysical || 'strength';
  const physicalAttr = character.attributes?.[keyPhysical] as any;
  const unarmedMod = physicalAttr?.rollModifier || 0;

  // Unarmed damage calculation
  const baseUnarmedDamage = character.unarmedMastery?.damageDie || '1d2';
  const unarmedFortalecerBonuses = obterBonusFortalecerDanoRecuperacao(activePowers || [], {
    tipo: 'DESARMADO'
  }, character);

  let finalUnarmedDamage = baseUnarmedDamage;
  for (const fb of unarmedFortalecerBonuses) {
    if (fb.configId === 'dano') {
      const descSuffix = fb.descritor ? ` [${fb.descritor}]` : '';
      finalUnarmedDamage += ` + ${fb.formula.replace(/^\+/, '')}${descSuffix}`;
    }
  }

  const unarmedCritBonus = obterBonusFortalecerCaracteristicasDesarmado(activePowers || []);
  const criticoAprimoradoDesarmado = obterReducaoCriticoParaArma(character, null, true);
  const finalUnarmedCritMargin = Math.max(1, (character.unarmedMastery?.criticalMargin || 20) - unarmedCritBonus.critMarginBonus - criticoAprimoradoDesarmado);
  const finalUnarmedCritMultiplier = (character.unarmedMastery?.criticalMultiplier || 2) + unarmedCritBonus.critMultiplierBonus;

  const options: {
    label: string;
    sub: string;
    modifier: number;
    damageFormula?: string;
    damageModifier?: number;
    critMargin?: number;
    critMultiplier?: number;
    onClick: () => void;
  }[] = [
    {
      label: 'Desarmado',
      sub: `Modificador: +${unarmedMod}`,
      modifier: unarmedMod,
      damageFormula: finalUnarmedDamage,
      damageModifier: unarmedMod,
      critMargin: finalUnarmedCritMargin,
      critMultiplier: finalUnarmedCritMultiplier,
      onClick: () => {
        const { rule, extraDice } = getRollAdvantageDisadvantage(character, 'attack', { attackType: 'melee' });
        onRoll({
          label: 'Aparar (Desarmado)',
          modifier: unarmedMod,
          damageFormula: finalUnarmedDamage,
          damageModifier: unarmedMod,
          critMargin: finalUnarmedCritMargin,
          critMultiplier: finalUnarmedCritMultiplier,
          efficiencyBonus: character.efficiencyBonus || 0,
          initialApplyEfficiency: true,
          initialRule: rule,
          initialExtraDice: extraDice,
        });
        onClose();
      }
    }
  ];

  // Armas equipadas
  const equippedHands = character.equipment?.hands || [];
  equippedHands.forEach((hand, idx) => {
    const detail = handsDetails[hand.itemId];
    if (detail && detail.tipo === 'weapon') {
      const isMelee = isArmaCorpoACorpo(detail);
      if (isMelee) {
        const escalonamentoBase = detail.atributoEscalonamento || detail.danos?.[0]?.base || 'FISICA';
        const escalonamento = escalonamentoBase.toUpperCase();
        const map: Record<string, keyof CharacterResponse['attributes']> = {
          'FOR': 'strength', 'FORÇA': 'strength', 'STRENGTH': 'strength',
          'DES': 'dexterity', 'DESTREZA': 'dexterity', 'DEXTERITY': 'dexterity',
          'CON': 'constitution', 'CONSTITUIÇÃO': 'constitution', 'CONSTITUTION': 'constitution',
          'INT': 'intelligence', 'INTELIGÊNCIA': 'intelligence', 'INTELLIGENCE': 'intelligence',
          'SAB': 'wisdom', 'SABEDORIA': 'wisdom', 'WISDOM': 'wisdom',
          'CAR': 'charisma', 'CARISMA': 'charisma', 'CHARISMA': 'charisma',
          'FISICA': character.attributes.keyPhysical,
          'MENTAL': character.attributes.keyMental
        };
        const attrKey = map[escalonamento] || character.attributes.keyPhysical || 'strength';
        const mod = (character.attributes[attrKey] as any)?.rollModifier || 0;

        const baseWeaponDamage = detail.danos?.map((d: any) => d.dado).join(' + ') || '';
        const weaponDomains = detail.dominios?.map((d: any) => d.name) || [];
        const weaponFortalecerBonuses = obterBonusFortalecerDanoRecuperacao(activePowers || [], {
          tipo: 'ARMA',
          domains: weaponDomains,
          itemId: detail.id
        }, character);

        let finalWeaponDamage = baseWeaponDamage;
        for (const fb of weaponFortalecerBonuses) {
          if (fb.configId === 'dano') {
            const descSuffix = fb.descritor ? ` [${fb.descritor}]` : '';
            finalWeaponDamage += ` + ${fb.formula.replace(/^\+/, '')}${descSuffix}`;
          }
        }

        const itemFortalecerBonus = obterBonusFortalecerCaracteristicasItem(activePowers || [], detail.id);
        const criticoAprimoradoArma = obterReducaoCriticoParaArma(character, detail);
        const finalCritMargin = Math.max(1, (detail.critMargin || 20) - itemFortalecerBonus.critMarginBonus - criticoAprimoradoArma);
        const finalCritMultiplier = (detail.critMultiplier || 2) + itemFortalecerBonus.critMultiplierBonus;

        options.push({
          label: detail.nome,
          sub: `Mão ${idx + 1} · Modificador: +${mod}`,
          modifier: mod,
          damageFormula: finalWeaponDamage,
          damageModifier: mod,
          critMargin: finalCritMargin,
          critMultiplier: finalCritMultiplier,
          onClick: () => {
            const { rule, extraDice } = getRollAdvantageDisadvantage(character, 'attack', { attackType: 'melee' });
            onRoll({
              label: `Aparar (${detail.nome})`,
              modifier: mod,
              damageFormula: finalWeaponDamage,
              damageModifier: mod,
              critMargin: finalCritMargin,
              critMultiplier: finalCritMultiplier,
              efficiencyBonus: character.efficiencyBonus || 0,
              initialApplyEfficiency: true,
              initialRule: rule,
              initialExtraDice: extraDice,
            });
            onClose();
          }
        });
      }
    }
  });

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="fixed z-[999] rounded-xl border-2 shadow-2xl p-3 space-y-3 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-tight text-gray-700 dark:text-gray-200">
          <Swords className="w-3.5 h-3.5 text-amber-500" />
          Aparar Ataque
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Escolha uma arma para o teste:</p>
          <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={opt.onClick}
                className="w-full text-left p-2 rounded-lg bg-white/70 dark:bg-black/35 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-gray-200/50 dark:border-gray-700/50 transition-all flex justify-between items-center group"
              >
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                    {opt.label}
                  </p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400">
                    {opt.sub}
                  </p>
                </div>
                <Dices className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            onFail();
            onClose();
          }}
          className="w-full text-xs font-black py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-colors flex items-center justify-center gap-1 shadow-md shadow-red-600/10"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Falhar no Aparo
        </button>
      </div>
    </>,
    document.body
  );
}

export function DefenseCard({ character, activePowers, onSync }: DefenseCardProps) {
  const { dodge, baseRD, blockRD } = character.combatStats;
  const activeFortalecerRD = obterBonusFortalecerRD(activePowers || [], character);
  const finalBaseRD = baseRD + activeFortalecerRD;
  const blockTotal = finalBaseRD + blockRD;
  const isVulneravel = hasConditionEffectOf(character.conditions || [], 'Vulnerável');

  const [isRolling, setIsRolling] = useState(false);
  const [openPopup, setOpenPopup] = useState<'block' | 'resist' | 'baseRD' | null>(null);

  // Refs for anchor positioning
  const blockAnchorRef = useRef<HTMLDivElement>(null);
  const resistAnchorRef = useRef<HTMLDivElement>(null);
  const baseRDAnchorRef = useRef<HTMLDivElement>(null);

  const [openParry, setOpenParry] = useState(false);
  const parryAnchorRef = useRef<HTMLDivElement>(null);
  const [parryRollConfig, setParryRollConfig] = useState<{
    label: string;
    modifier: number;
    damageFormula?: string;
    damageModifier?: number;
    critMargin?: number;
    critMultiplier?: number;
    efficiencyBonus?: number;
    initialApplyEfficiency?: boolean;
    initialRule?: 'advantage' | 'disadvantage' | 'normal';
    initialExtraDice?: number;
  } | null>(null);

  const [handsDetails, setHandsDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    let active = true;
    const fetchHands = async () => {
      const equippedHands = character.equipment?.hands || [];
      const itemIds = equippedHands.map(h => h.itemId).filter(Boolean);
      if (itemIds.length === 0) {
        if (active) setHandsDetails({});
        return;
      }
      try {
        const results = await Promise.all(itemIds.map(id => getItemById(id).catch(() => null)));
        if (!active) return;
        const map: Record<string, any> = {};
        results.forEach(item => {
          if (item) map[item.id] = item;
        });
        setHandsDetails(map);
      } catch (err) {
        console.error('Error fetching hands details for parry:', err);
      }
    };
    fetchHands();
    return () => {
      active = false;
    };
  }, [character.equipment?.hands]);

  const handleFailParry = async () => {
    if (!onSync) return;
    const currentConditions = character.conditions || [];
    const hasDesprevenido = currentConditions.some((c: string) => {
      const clean = c.includes('(') ? c.split('(')[0].trim() : c;
      return clean === 'Desprevenido';
    });
    if (hasDesprevenido) {
      toast.info('O personagem já está Desprevenido!');
      return;
    }
    const newConditions = [...currentConditions, 'Desprevenido'];
    try {
      await onSync({ conditions: newConditions });
      toast.success('Falhou no Aparo: Condição Desprevenido aplicada!');
    } catch (err) {
      console.error('Error applying Desprevenido condition:', err);
      toast.error('Erro ao aplicar condição Desprevenido.');
    }
  };

  const isDesprevenidoOrIndefeso = hasConditionEffectOf(character.conditions || [], 'Desprevenido');

  const equippedHands = character.equipment?.hands || [];
  const weaponsInHands = equippedHands
    .map(h => handsDetails[h.itemId])
    .filter(detail => detail && detail.tipo === 'weapon');

  const hasOnlyRangedWeapons = weaponsInHands.length > 0 && weaponsInHands.every(w => isArmaDistancia(w));
  const parryDisabled = isDesprevenidoOrIndefeso || hasOnlyRangedWeapons;

  const parryTitle = isDesprevenidoOrIndefeso
    ? "Você não pode aparar sob esta condição"
    : hasOnlyRangedWeapons
      ? "Não é possível aparar com armas de ataque à distância"
      : "Clique para aparar";

  const applyDamage = useCallback(async (dano: number) => {
    if (onSync && dano > 0) {
      await onSync({ pvChange: -dano });
    }
  }, [onSync]);

  return (
    <>
      <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden relative group">
        <CardContent className="p-4 grid grid-cols-3 gap-3">
          {/* Esquiva */}
          <div
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all active:scale-95 group/item
              ${isDesprevenidoOrIndefeso
                ? 'bg-gray-100 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800/60 opacity-60 cursor-not-allowed'
                : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 cursor-pointer hover:border-blue-500/50'
              }`}
            onClick={() => {
              if (isDesprevenidoOrIndefeso) {
                toast.error('Você não pode se esquivar sob esta condição!');
                return;
              }
              setIsRolling(true);
            }}
            title={isDesprevenidoOrIndefeso ? "Você não pode se esquivar sob esta condição" : "Clique para rolar Esquiva"}
          >
            <Shield className="w-4 h-4 text-blue-500 mb-1 group-hover/item:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Esquiva</span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-blue-900 dark:text-blue-100">
                {dodge >= 0 ? `+${dodge}` : dodge}
              </span>
              {!isDesprevenidoOrIndefeso && <Dices className="w-3 h-3 text-blue-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />}
            </div>
          </div>

          {/* RD Base — clicável */}
          <div
            ref={baseRDAnchorRef}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all active:scale-95 group/baseRD relative
              ${openPopup === 'baseRD'
                ? 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
                : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 hover:border-red-400/60'
              }`}
            onClick={() => setOpenPopup(openPopup === 'baseRD' ? null : 'baseRD')}
            title="Clique para calcular dano com RD Base"
          >
            <ShieldAlert className="w-4 h-4 text-red-500 mb-1 shrink-0 group-hover/baseRD:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter shrink-0">RD Base</span>
            <div className="flex flex-col items-center gap-0">
              <span className="text-xl font-black text-red-900 dark:text-red-100 leading-none">{baseRD}</span>
              <span
                className="text-[9px] font-bold text-red-600 dark:text-red-400"
                title={`RD Base ${baseRD} + Fortalecer RD ${activeFortalecerRD}`}
              >
                Total: {finalBaseRD}
              </span>
            </div>
            <div
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-gray-900"
              title="Calculado Automaticamente"
            />
          </div>

          {/* RD Bloqueio — clicável */}
          <div
            ref={blockAnchorRef}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all active:scale-95 group/block
              ${openPopup === 'block'
                ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600'
                : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20 hover:border-orange-400/60'
              }`}
            onClick={() => setOpenPopup(openPopup === 'block' ? null : 'block')}
            title="Clique para calcular dano bloqueado"
          >
            <Swords className="w-4 h-4 text-orange-500 mb-1 group-hover/block:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Bloqueio</span>
            <div className="flex flex-col items-center gap-0">
              <span className="text-xl font-black text-orange-900 dark:text-orange-100 leading-none">{blockRD}</span>
              <span
                className="text-[9px] font-bold text-orange-600 dark:text-orange-400"
                title={`RD Base ${finalBaseRD} + Bloqueio ${blockRD}`}
              >
                Total: {blockTotal}
              </span>
            </div>
          </div>
        </CardContent>

        {/* Resistência */}
        <div className="px-4 pb-4">
          <div
            ref={resistAnchorRef}
            className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border cursor-pointer transition-all active:scale-[0.99] group/resist
              ${openPopup === 'resist'
                ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
                : 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20 hover:border-purple-400/60'
              }`}
            onClick={() => setOpenPopup(openPopup === 'resist' ? null : 'resist')}
            title="Clique para calcular dano com resistência (metade), vulnerabilidade (x2) e suscetibilidade (x2)"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-500 group-hover/resist:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                Resistência & Mult.
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {isVulneravel ? (
                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-red-600 dark:text-red-400 animate-pulse bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                  <ShieldAlert className="w-2.5 h-2.5 text-red-500" />
                  Vulnerável (x2)
                </div>
              ) : (
                <>
                  <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-900/20 uppercase tracking-tight">
                    Metade / x2 / x4
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Aparar */}
        <div className="px-4 pb-4 pt-0">
          <div
            ref={parryAnchorRef}
            className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border cursor-pointer transition-all active:scale-[0.99] group/parry
              ${parryDisabled
                ? 'bg-gray-100 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800/60 opacity-60 cursor-not-allowed'
                : openParry
                  ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600'
                  : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 hover:border-amber-400/60'
              }`}
            onClick={() => {
              if (parryDisabled) {
                if (isDesprevenidoOrIndefeso) {
                  toast.error('Você não pode aparar sob esta condição!');
                } else if (hasOnlyRangedWeapons) {
                  toast.error('Não é possível aparar com armas de ataque à distância!');
                }
                return;
              }
              setOpenParry(!openParry);
            }}
            title={parryTitle}
          >
            <div className="flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-amber-500 group-hover/parry:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                Aparar
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dices className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Teste de Aparo</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Portals for popups — rendered at body level to escape overflow:hidden */}
      {openPopup === 'baseRD' && (
        <DamageCalcPortal
          anchorRef={baseRDAnchorRef}
          title="Calcular RD Base"
          icon={<ShieldAlert className="w-3 h-3 text-red-500" />}
          rdTotal={finalBaseRD}
          halveDamage={false}
          doubleDamage={hasConditionEffectOf(character.conditions || [], 'Vulnerável')}
          accentColor="red"
          onApply={applyDamage}
          onClose={() => setOpenPopup(null)}
        />
      )}

      {openPopup === 'block' && (
        <DamageCalcPortal
          anchorRef={blockAnchorRef}
          title="Calcular Bloqueio"
          icon={<Swords className="w-3 h-3 text-orange-500" />}
          rdTotal={blockTotal}
          halveDamage={false}
          doubleDamage={hasConditionEffectOf(character.conditions || [], 'Vulnerável')}
          accentColor="orange"
          onApply={applyDamage}
          onClose={() => setOpenPopup(null)}
        />
      )}

      {openPopup === 'resist' && (
        <DamageCalcPortal
          anchorRef={resistAnchorRef}
          title="Calcular Resistência"
          icon={<ShieldCheck className="w-3 h-3 text-purple-500" />}
          rdTotal={finalBaseRD}
          halveDamage={true}
          doubleDamage={hasConditionEffectOf(character.conditions || [], 'Vulnerável')}
          accentColor="purple"
          onApply={applyDamage}
          onClose={() => setOpenPopup(null)}
        />
      )}

      {openParry && (
        <ParryPortal
          anchorRef={parryAnchorRef}
          character={character}
          handsDetails={handsDetails}
          activePowers={activePowers}
          onClose={() => setOpenParry(false)}
          onRoll={(config) => setParryRollConfig(config)}
          onFail={handleFailParry}
        />
      )}

      {(() => {
        const grauRolamentoDefensivo = obterGrauBeneficio(character, 'Rolamento defensivo');
        const initialRule = grauRolamentoDefensivo > 0 ? 'advantage' : 'normal';
        const initialExtraDice = grauRolamentoDefensivo > 0 ? Math.min(3, grauRolamentoDefensivo) : 0;

        return (
          <DiceRoller
            isOpen={isRolling}
            onClose={() => setIsRolling(false)}
            label="Teste de Esquiva"
            modifier={dodge}
            modifierLabel="Bônus de Esquiva"
            initialRule={initialRule}
            initialExtraDice={initialExtraDice}
          />
        );
      })()}

      {parryRollConfig && (
        <DiceRoller
          isOpen={!!parryRollConfig}
          onClose={() => setParryRollConfig(null)}
          label={parryRollConfig.label}
          modifier={parryRollConfig.modifier}
          damageFormula={parryRollConfig.damageFormula}
          damageModifier={parryRollConfig.damageModifier}
          modifierLabel="Modificador de Ataque"
          critMargin={parryRollConfig.critMargin}
          critMultiplier={parryRollConfig.critMultiplier}
          efficiencyBonus={parryRollConfig.efficiencyBonus}
          initialApplyEfficiency={parryRollConfig.initialApplyEfficiency}
          initialRule={parryRollConfig.initialRule}
          initialExtraDice={parryRollConfig.initialExtraDice}
        />
      )}
    </>
  );
}
