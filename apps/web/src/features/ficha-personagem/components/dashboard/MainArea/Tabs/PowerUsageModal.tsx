import { useState } from 'react';
import { Modal, ModalFooter, Button, Badge } from '@/shared/ui';
import { Zap, Clock, Ruler, Timer, Play, Dices, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ESCALAS, buscarGrauNaTabela, buscarDominio } from '@/data';
import type { PoderResponse } from '@/services/types';
import type { ResolvePowerResponse } from '@/services/powers.service';
import { describeMutations } from '@/features/ficha-personagem/hooks/usePowerUsage';
import { DiceRoller } from '@/shared/components/DiceRoller';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNomeEscala(tipo: 'acao' | 'alcance' | 'duracao', valor: number): string {
  const escala = ESCALAS[tipo]?.escala.find((e: { valor: number }) => e.valor === valor);
  return escala?.nome || String(valor);
}

const DURACAO_LABELS: Record<number, string> = {
  0: 'Instantâneo',
  1: 'Concentração',
  2: 'Sustentado',
  3: 'Ativado (Cena)',
  4: 'Permanente',
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PowerUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  power: PoderResponse;
  character: any;
  currentPE: number;
  /** Mutações retornadas pelo motor (etapa de preview). null = ainda resolvendo. */
  resolution: ResolvePowerResponse | null;
  isResolving: boolean;
  isConfirming: boolean;
  onConfirm: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PowerUsageModal({
  isOpen,
  onClose,
  power,
  character,
  currentPE,
  resolution,
  isResolving,
  isConfirming,
  onConfirm,
}: PowerUsageModalProps) {
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [diceRollerConfig, setDiceRollerConfig] = useState<any>({});
  const [showMutations, setShowMutations] = useState(true);

  const peCost = power.custoTotal?.pe ?? 0;
  const duracao = power.parametros.duracao;
  const hasEnoughPE = currentPE >= peCost;

  // Dados do caster para o assistente de rolagem
  const dominioInfo = buscarDominio(power.dominio.name);
  const isMental = dominioInfo ? dominioInfo.espiritual : false;
  const keyFisico = character?.attributes?.keyPhysical || 'strength';
  const modFisico = character?.attributes?.[keyFisico]?.rollModifier || 0;
  const keyMental = character?.attributes?.keyMental || 'intelligence';
  const modMental = character?.attributes?.[keyMental]?.rollModifier || 0;
  const effTeste = isMental ? modMental : modFisico;
  const eficiencia = character?.efficiencyBonus || 0;
  const cdInfo = 10 + effTeste;

  // Fórmula de dano para rolagem rápida
  const efeitoComDados = power.effects.find(
    (e: any) => e.effectBaseId === 'dano' || e.effectBaseId === 'fortalecer',
  );
  const danoInfo = efeitoComDados ? buscarGrauNaTabela(efeitoComDados.grau) : null;
  const baseDanoFormula = danoInfo ? danoInfo.dano : '';

  // Descrições das mutações vindas do motor
  const mutationDescriptions =
    resolution?.mutations && resolution.mutations.length > 0
      ? describeMutations(resolution.mutations)
      : [];

  const isNarrative = resolution?.resolutionMode === 'NARRATIVE';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Usar: ${power.nome}`} size="sm">
      <div className="space-y-4 py-1">

        {/* ─── Resumo do poder ──────────────────────────────────────────── */}
        <div className="flex gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col gap-1.5 flex-1 text-[11px] text-gray-600 dark:text-gray-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {getNomeEscala('acao', power.parametros.acao)}
            </span>
            <span className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              {getNomeEscala('alcance', power.parametros.alcance)}
            </span>
            <span className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              {DURACAO_LABELS[duracao] ?? getNomeEscala('duracao', duracao)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-4 border-l border-gray-200 dark:border-gray-700 min-w-[80px]">
            <Zap className={`w-5 h-5 mb-1 ${hasEnoughPE ? 'text-blue-500' : 'text-red-500'}`} />
            <span className={`text-2xl font-black ${hasEnoughPE ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
              {peCost}
            </span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PE</span>
          </div>
        </div>

        {/* ─── Alerta PE insuficiente ───────────────────────────────────── */}
        {!hasEnoughPE && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            PE insuficiente — você tem {currentPE} PE, o poder custa {peCost} PE.
          </div>
        )}

        {/* ─── Resultado do motor de automação ─────────────────────────── */}
        {isResolving && (
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 text-xs font-bold animate-pulse">
            <Zap className="w-4 h-4" /> Calculando efeitos...
          </div>
        )}

        {!isResolving && isNarrative && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400 font-bold">
            📖 Poder narrativo — resolução com o narrador na mesa.
          </div>
        )}

        {!isResolving && !isNarrative && mutationDescriptions.length > 0 && (
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden">
            <button
              onClick={() => setShowMutations(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 dark:bg-indigo-900/10 text-[10px] font-black uppercase tracking-wider text-indigo-500"
            >
              <span>⚙️ Efeitos do Motor ({mutationDescriptions.length})</span>
              {showMutations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showMutations && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {mutationDescriptions.map((desc, i) => (
                  <li key={i} className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                    {desc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ─── Assistente de rolagem ────────────────────────────────────── */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Assistente de Dados</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 px-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400"
              onClick={() => {
                setDiceRollerConfig({
                  label: `Teste de Efeito (${isMental ? 'Mental' : 'Físico'})`,
                  modifier: effTeste,
                  efficiencyBonus: eficiencia,
                  initialApplyEfficiency: true,
                });
                setIsDiceRollerOpen(true);
              }}
            >
              <Dices className="w-3 h-3" />
              Teste: {effTeste >= 0 ? `+${effTeste}` : effTeste}
            </Button>

            {baseDanoFormula && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1 px-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-500"
                onClick={() => {
                  setDiceRollerConfig({
                    label: 'Dado Universal (Base)',
                    modifier: effTeste,
                    damageFormula: baseDanoFormula,
                  });
                  setIsDiceRollerOpen(true);
                }}
              >
                <Dices className="w-3 h-3 text-amber-500" />
                Dado: {baseDanoFormula}
              </Button>
            )}
          </div>
          <p className="text-[10px] font-bold text-gray-400">
            CD do Poder (resistência):{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-black">{cdInfo}</span>
          </p>
        </div>

        {/* ─── Efeitos do poder (badges) ────────────────────────────────── */}
        {power.effects && power.effects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {power.effects.map((e: any, i: number) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[9px] px-1.5 py-0 border-indigo-300 text-indigo-600"
              >
                {e.effectBaseId} {e.grau !== 0 && (e.grau > 0 ? `+${e.grau}` : e.grau)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          loading={isConfirming}
          disabled={!hasEnoughPE || isConfirming || isResolving}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Play className="w-4 h-4" />
          {peCost > 0 ? `Usar (−${peCost} PE)` : 'Ativar'}
        </Button>
      </ModalFooter>

      <DiceRoller
        isOpen={isDiceRollerOpen}
        onClose={() => setIsDiceRollerOpen(false)}
        {...diceRollerConfig}
      />
    </Modal>
  );
}
