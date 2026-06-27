import { Button, Badge } from '@/shared/ui';
import { Zap, Timer, X, Flame } from 'lucide-react';
import type { ActivePower } from '@/features/ficha-personagem/hooks/usePowerUsage';
import { DynamicIcon } from '@/shared/ui';

const DURACAO_LABELS: Record<number, string> = {
  0: 'Instantâneo',
  1: 'Concentração',
  2: 'Sustentado',
  3: 'Ativado (Cena)',
  4: 'Permanente',
};

interface ActivePowersTrackerProps {
  activePowers: ActivePower[];
  onMaintain: (id: string) => void;
  onDeactivate: (id: string) => void;
  isDisabled: boolean;
}

export function ActivePowersTracker({
  activePowers,
  onMaintain,
  onDeactivate,
  isDisabled,
}: ActivePowersTrackerProps) {
  if (activePowers.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Flame className="w-3.5 h-3.5 text-orange-500" />
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
          Poderes Ativos ({activePowers.length})
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {activePowers.map(ap => (
          <div
            key={ap.id}
            className="flex items-center gap-3 p-3 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/5 transition-all"
          >
            {/* Ícone */}
            <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900 overflow-hidden">
              {ap.icone ? (
                <DynamicIcon name={ap.icone} className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-4 h-4 text-indigo-500" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate leading-tight text-gray-900 dark:text-gray-100">
                {ap.nome}
              </p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <Timer className="w-3 h-3" />
                {DURACAO_LABELS[ap.duracao] ?? 'Ativado'}
              </p>
            </div>

            {/* Botão manter (só para Concentração e Sustentado) */}
            {(ap.duracao === 1 || ap.duracao === 2) ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] uppercase font-bold shrink-0 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400"
                onClick={() => onMaintain(ap.id)}
                disabled={isDisabled || ap.peCostPerRound <= 0}
                title={`Manter custa ${ap.peCostPerRound} PE por rodada`}
              >
                Manter (−{ap.peCostPerRound} PE)
              </Button>
            ) : (
              <Badge variant="secondary" className="text-[9px] shrink-0 opacity-70">
                Infinito
              </Badge>
            )}

            {/* Botão encerrar */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              onClick={() => onDeactivate(ap.id)}
              title="Encerrar poder"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
