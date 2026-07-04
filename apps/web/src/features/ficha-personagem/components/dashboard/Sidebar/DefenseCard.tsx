import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardContent } from '@/shared/ui';
import { Shield, Swords, ShieldAlert, Dices, ShieldCheck, Zap } from 'lucide-react';
import { DiceRoller } from '@/shared/components/DiceRoller';
import { obterBonusFortalecerRD } from '@/features/ficha-personagem/utils/fortalecerHelper';

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
  accentColor,
  onApply,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  icon: React.ReactNode;
  rdTotal: number;
  halveDamage: boolean;
  accentColor: 'orange' | 'purple';
  onApply: (dano: number) => void;
  onClose: () => void;
}) {
  const [rawDamage, setRawDamage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Focus input on open
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Calculate position from anchor (fixed = viewport coords, no scroll offset)
  const calcPos = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popupWidth = Math.max(rect.width, 230);
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
  const afterHalve = halveDamage ? Math.floor(raw / 2) : raw;
  const finalDamage = Math.max(0, afterHalve - rdTotal);

  const handleApply = () => {
    if (raw > 0) onApply(finalDamage);
    onClose();
  };

  const borderColor = accentColor === 'orange'
    ? 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/60'
    : 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/60';

  if (!pos) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[998]" onClick={onClose} />

      {/* Popup */}
      <div
        className={`fixed z-[999] rounded-xl border-2 shadow-2xl p-3 space-y-2 ${borderColor}`}
        style={{ top: pos.top, left: pos.left, width: pos.width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-tight text-gray-700 dark:text-gray-200">
          {icon}
          {title}
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
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400"
        />

        {raw > 0 && (
          <div className="text-[10px] space-y-0.5 text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-black/30 rounded p-1.5">
            {halveDamage && (
              <div className="flex justify-between">
                <span>Metade do dano:</span>
                <span className="font-bold">{afterHalve}</span>
              </div>
            )}
            {rdTotal > 0 && (
              <div className="flex justify-between">
                <span>RD absorvida:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  -{Math.min(afterHalve, rdTotal)}
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
            className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

export function DefenseCard({ character, activePowers, onSync }: DefenseCardProps) {
  const { dodge, baseRD, blockRD } = character.combatStats;
  const activeFortalecerRD = obterBonusFortalecerRD(activePowers || [], character);
  const finalBaseRD = baseRD + activeFortalecerRD;
  const blockTotal = finalBaseRD + blockRD;

  const [isRolling, setIsRolling] = useState(false);
  const [openPopup, setOpenPopup] = useState<'block' | 'resist' | null>(null);

  // Refs for anchor positioning
  const blockAnchorRef = useRef<HTMLDivElement>(null);
  const resistAnchorRef = useRef<HTMLDivElement>(null);

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
            className="flex flex-col items-center gap-1 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 cursor-pointer hover:border-blue-500/50 transition-all active:scale-95 group/item"
            onClick={() => setIsRolling(true)}
          >
            <Shield className="w-4 h-4 text-blue-500 mb-1 group-hover/item:scale-110 transition-transform" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Esquiva</span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-blue-900 dark:text-blue-100">
                {dodge >= 0 ? `+${dodge}` : dodge}
              </span>
              <Dices className="w-3 h-3 text-blue-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* RD Base */}
          <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 relative">
            <ShieldAlert className="w-4 h-4 text-red-500 mb-1 shrink-0" />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter shrink-0">RD Base</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-red-900 dark:text-red-100 leading-none">{finalBaseRD}</span>
              {activeFortalecerRD > 0 && (
                <span
                  className="text-[10px] font-black text-amber-600 dark:text-amber-400 ml-0.5 animate-pulse"
                  title="Bônus Temporário de Fortalecer RD"
                >
                  (+{activeFortalecerRD})
                </span>
              )}
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
            title="Clique para calcular dano com resistência (metade)"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-500 group-hover/resist:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                Resistência
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Dano pela metade</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Portals for popups — rendered at body level to escape overflow:hidden */}
      {openPopup === 'block' && (
        <DamageCalcPortal
          anchorRef={blockAnchorRef}
          title="Calcular Bloqueio"
          icon={<Swords className="w-3 h-3 text-orange-500" />}
          rdTotal={blockTotal}
          halveDamage={false}
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
          accentColor="purple"
          onApply={applyDamage}
          onClose={() => setOpenPopup(null)}
        />
      )}

      <DiceRoller
        isOpen={isRolling}
        onClose={() => setIsRolling(false)}
        label="Teste de Esquiva"
        modifier={dodge}
        modifierLabel="Bônus de Esquiva"
      />
    </>
  );
}
