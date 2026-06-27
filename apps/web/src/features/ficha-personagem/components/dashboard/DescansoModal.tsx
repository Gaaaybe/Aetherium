import { useState } from 'react';
import { Modal, ModalFooter, Button, Badge } from '@/shared/ui';
import { Moon, Zap, Heart, Utensils, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { CharacterResponse } from '@/services/characters.types';

interface DescansoModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterResponse;
  onRest: (payload: {
    quality: 'RUIM' | 'NORMAL' | 'CONFORTAVEL' | 'LUXUOSA';
    durationHours: number;
    hasCare?: boolean;
    useGastronomicRule?: boolean;
    consumedMeal?: boolean;
  }) => Promise<any>;
  isProcessing: boolean;
}

export function DescansoModal({
  isOpen,
  onClose,
  character,
  onRest,
  isProcessing,
}: DescansoModalProps) {
  // Configurações de Estado do Descanso
  const [quality, setQuality] = useState<'RUIM' | 'NORMAL' | 'CONFORTAVEL' | 'LUXUOSA'>('NORMAL');
  const [durationHours, setDurationHours] = useState<number>(8);
  const [hasCare, setHasCare] = useState<boolean>(false);
  const [useGastronomicRule, setUseGastronomicRule] = useState<boolean>(false);
  const [consumedMeal, setConsumedMeal] = useState<boolean>(true);

  // Estado do Resultado
  const [restResult, setRestResult] = useState<{
    pvChange: number;
    peChange: number;
    isFaminto: boolean;
  } | null>(null);

  const timeMultiplier = durationHours / 8;
  const hasInjury = character.conditions?.includes('Lesão');

  const handleConfirmRest = async () => {
    try {
      const updatedCharacter = await onRest({
        quality,
        durationHours,
        hasCare,
        useGastronomicRule,
        consumedMeal,
      });

      if (updatedCharacter && updatedCharacter.restChange) {
        setRestResult({
          pvChange: updatedCharacter.restChange.pvChange,
          peChange: updatedCharacter.restChange.peChange,
          isFaminto: updatedCharacter.conditions?.includes('Faminto') || false,
        });
      } else {
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseResult = () => {
    setRestResult(null);
    onClose();
  };

  // Definição das qualidades e suas rolagens teóricas
  const QUALIDADES = [
    {
      id: 'RUIM' as const,
      nome: 'Ruim',
      desc: 'Ao relento, sem acampamento',
      formula: '1d[Max] / 3',
      color: 'border-red-200 hover:border-red-400 bg-red-50/10 dark:bg-red-950/5',
      activeColor: 'ring-2 ring-red-500 border-red-500 bg-red-500/10',
    },
    {
      id: 'NORMAL' as const,
      nome: 'Normal',
      desc: 'Estalagem comum ou acampamento',
      formula: '1d[Max] / 2',
      color: 'border-yellow-200 hover:border-yellow-400 bg-yellow-50/10 dark:bg-yellow-950/5',
      activeColor: 'ring-2 ring-yellow-500 border-yellow-500 bg-yellow-500/10',
    },
    {
      id: 'CONFORTAVEL' as const,
      nome: 'Confortável',
      desc: 'Estalagem de boa qualidade',
      formula: '1d[Max]',
      color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/5',
      activeColor: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10',
    },
    {
      id: 'LUXUOSA' as const,
      nome: 'Luxuosa',
      desc: 'Quarto real ou estalagem luxuosa',
      formula: '2d[Max]',
      color: 'border-purple-200 hover:border-purple-400 bg-purple-50/10 dark:bg-purple-950/5',
      activeColor: 'ring-2 ring-purple-500 border-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isProcessing) {
          setRestResult(null);
          onClose();
        }
      }}
      title="Descanso do Personagem"
      size="lg"
    >
      {!restResult ? (
        <div className="space-y-6 py-2">
          {/* Info do Livro */}
          <div className="flex gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-gray-600 dark:text-gray-400">
            <Moon className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-0.5">Regra de Inatividade</p>
              <p>
                O descanso dura 8 horas. Duração menor reduz proporcionalmente os benefícios (mínimo de 2 horas).
                Se tiver a condição <strong className="text-red-500 font-black">Lesão</strong>, sua qualidade de descanso cai em 1 nível e exige cuidados médicos para recuperar PV.
              </p>
            </div>
          </div>

          {/* Selecionar Qualidade */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Qualidade do Alojamento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUALIDADES.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuality(q.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    quality === q.id ? q.activeColor : q.color
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">{q.nome}</span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase">
                      {q.formula}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">{q.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selecionar Duração */}
          <div className="space-y-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Duração do Descanso
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo de 2h</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{durationHours}h</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 block font-bold">
                  {timeMultiplier * 100}% dos benefícios
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[2, 3, 4, 5, 6, 7, 8].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setDurationHours(h)}
                  className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${
                    durationHours === h
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Seção Condição Lesão */}
          {hasInjury && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">
                    Personagem lesionado
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-normal">
                    A qualidade de descanso será rebaixada em um nível. Para recuperar qualquer PV, o personagem precisa ter recebido primeiros socorros ou medicina.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer bg-white/50 dark:bg-black/20 p-2.5 rounded-lg border border-amber-500/10">
                <input
                  type="checkbox"
                  checked={hasCare}
                  onChange={(e) => setHasCare(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-4 h-4"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Recebeu cuidados médicos durante o descanso
                </span>
              </label>
            </div>
          )}

          {/* Regra Gastronômica */}
          <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Regra Opcional Gastronômica
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGastronomicRule}
                  onChange={(e) => setUseGastronomicRule(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {useGastronomicRule && (
              <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/10 space-y-2.5 animate-in fade-in duration-200">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  Se ativado, o personagem deve consumir ao menos uma refeição. Sem comer, o personagem fica faminto e não recupera PV/PE.
                </p>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setConsumedMeal(true)}
                    className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${
                      consumedMeal
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Consumiu Refeição
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsumedMeal(false)}
                    className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${
                      !consumedMeal
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Não Comeu (Faminto)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tela de Resultados */
        <div className="space-y-6 py-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Descanso Concluído!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              O personagem repousou por {durationHours} horas na qualidade {quality.toLowerCase()}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col items-center">
              <Heart className="w-6 h-6 text-red-500 mb-1" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vida (PV)</span>
              <span className="text-2xl font-black text-red-600 mt-1">
                {restResult.pvChange >= 0 ? `+${restResult.pvChange}` : restResult.pvChange}
              </span>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex flex-col items-center">
              <Zap className="w-6 h-6 text-blue-500 mb-1" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Energia (PE)</span>
              <span className="text-2xl font-black text-blue-600 mt-1">
                {restResult.peChange >= 0 ? `+${restResult.peChange}` : restResult.peChange}
              </span>
            </div>
          </div>

          {restResult.isFaminto && (
            <div className="max-w-sm mx-auto p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2.5 text-left">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-xs">
                <p className="font-extrabold text-red-700 dark:text-red-400 uppercase tracking-tight">Condição: Faminto</p>
                <p className="text-gray-600 dark:text-gray-400">Você não recuperará PV/PE até se alimentar.</p>
              </div>
            </div>
          )}

          {!restResult.isFaminto && quality === 'RUIM' && hasInjury && (
            <div className="max-w-sm mx-auto p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2.5 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <p className="font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-tight">Efeito da Lesão</p>
                <p className="text-gray-600 dark:text-gray-400">O repouso precário sob ferimento resultou em perda de PV/PE.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <ModalFooter>
        {!restResult ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRest}
              loading={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-4 rounded-xl shadow-lg shadow-indigo-600/30 gap-2"
            >
              Confirmar Descanso <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            onClick={handleCloseResult}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl"
          >
            Fechar
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
