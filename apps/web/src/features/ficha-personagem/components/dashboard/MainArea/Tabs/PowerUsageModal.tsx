import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, Badge } from '@/shared/ui';
import { Zap, Clock, Ruler, Timer, Play, Dices, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ESCALAS, buscarGrauNaTabela, buscarDominio } from '@/data';
import type { PoderResponse } from '@/services/types';
import type { ResolvePowerResponse } from '@/services/powers.service';
import { describeMutations } from '@/features/ficha-personagem/hooks/usePowerUsage';
import { DiceRoller } from '@/shared/components/DiceRoller';
import { obterBonusFortalecerAtivos, obterBonusFortalecerDanoRecuperacao } from '@/features/ficha-personagem/utils/fortalecerHelper';
import { fortaleceAlvoMatch } from '@aetherium/rules-engine';

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

function obterModulacoesDeDados(formulaOriginal: string): Array<{ label: string; formula: string; dados: number; faces: number }> {
  if (!formulaOriginal) return [];
  const match = formulaOriginal.match(/^(\d+)d(\d+)$/i);
  if (!match) return [];
  const numDadosOriginal = parseInt(match[1], 10);
  const facesOriginal = parseInt(match[2], 10);
  const totalFaces = numDadosOriginal * facesOriginal;
  
  const opcoes: Array<{ label: string; formula: string; dados: number; faces: number }> = [];
  
  for (let Y = 1; Y <= 10; Y++) {
    if (totalFaces % Y === 0) {
      const Z = totalFaces / Y;
      if (Z >= 2) {
        opcoes.push({
          label: `${Y}d${Z}`,
          formula: `${Y}d${Z}`,
          dados: Y,
          faces: Z
        });
      }
    }
  }
  return opcoes;
}

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
  onConfirm: (options: { spendPE: boolean }) => void;
  showOptionalPE?: boolean;
  activePowers?: any[];
  onSync?: (data: any) => Promise<void>;
  onDeactivate?: (id: string) => void;
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
  showOptionalPE = false,
  activePowers = [],
  onSync,
  onDeactivate,
}: PowerUsageModalProps) {
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [diceRollerConfig, setDiceRollerConfig] = useState<any>({});
  const [showMutations, setShowMutations] = useState(true);
  const [formulasModularizadas, setFormulasModularizadas] = useState<Record<string, string>>({});
  const [spendPE, setSpendPE] = useState(true);

  const peCost = power.custoTotal?.pe ?? 0;
  const effectivePECost = spendPE ? peCost : 0;
  const duracao = power.parametros.duracao;
  const hasEnoughPE = currentPE >= effectivePECost;

  // Dados do caster para o assistente de rolagem
  const activeFortalecer = obterBonusFortalecerAtivos(activePowers, character);
  const dominioInfo = buscarDominio(power.dominio.name);
  const isMental = typeof power.dominio.espiritual === 'boolean'
    ? power.dominio.espiritual
    : (dominioInfo ? dominioInfo.espiritual : false);

  const espiritualDomains = ['natural', 'sagrado', 'sacrilegio', 'psiquico'];
  const isEspiritual = espiritualDomains.includes(power.dominio.name.toLowerCase()) ||
    (power.dominio.name.toLowerCase() === 'peculiar' && (typeof power.dominio.espiritual === 'boolean' ? power.dominio.espiritual : (dominioInfo?.espiritual ?? false)));

  const isDanoAcoplado =
    resolution?.isDanoAcoplado ??
    ((((power as any).originItemTipo?.toUpperCase() === 'WEAPON') || (power as any).originItemTipo === 'weapon') && !(isEspiritual && duracao === 0));

  const getBaseFormula = (grau: number) => {
    if (isDanoAcoplado) {
      return `1d${4 * Math.pow(2, Math.max(1, grau) - 1)}`;
    }
    const danoInfo = buscarGrauNaTabela(grau);
    return danoInfo ? danoInfo.dano : '';
  };

  const keyFisico = character?.attributes?.keyPhysical || 'strength';
  const modFisico = (character?.attributes?.[keyFisico]?.rollModifier || 0) + (activeFortalecer.atributos[keyFisico] || 0);
  const keyMental = character?.attributes?.keyMental || 'intelligence';
  const modMental = (character?.attributes?.[keyMental]?.rollModifier || 0) + (activeFortalecer.atributos[keyMental] || 0);
  const effTeste = isMental ? modMental : modFisico;
  const eficiencia = character?.efficiencyBonus || 0;
  const cdInfo = 10 + effTeste;

  // Filtra todos os efeitos que possuem rolagens de dano/cura
  const damageEffects = power.effects.filter(
    (e: any) => e.effectBaseId === 'dano' || e.effectBaseId === 'fortalecer' || e.effectBaseId === 'recuperacao',
  );

  useEffect(() => {
    const initial: Record<string, string> = {};
    damageEffects.forEach((e: any) => {
      const baseFormula = getBaseFormula(e.grau);
      initial[e.id] = e.dadoModularizado || baseFormula;
    });
    setFormulasModularizadas(initial);
  }, [power.effects, isDanoAcoplado]);

  const firstDamageEffect = damageEffects[0];
  const firstBaseFormula = firstDamageEffect ? getBaseFormula(firstDamageEffect.grau) : '';
  const firstFormulaSelecionada = firstDamageEffect ? (formulasModularizadas[firstDamageEffect.id] || firstDamageEffect.dadoModularizado || firstBaseFormula) : '';
  const firstHasBaseadoAtributos = firstDamageEffect ? (
    power.globalModifications.some((m: any) => m.modificationBaseId === 'baseado-atributos') ||
    firstDamageEffect.modifications?.some((m: any) => m.modificationBaseId === 'baseado-atributos')
  ) : false;

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
              {effectivePECost}
            </span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PE</span>
          </div>
        </div>

        {/* ─── Opção de gasto opcional de PE ────────────────────────────── */}
        {showOptionalPE && peCost > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50/30 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 text-xs font-bold">
            <input
              type="checkbox"
              id="spend-pe-checkbox"
              checked={spendPE}
              onChange={(e) => setSpendPE(e.target.checked)}
              className="w-4 h-4 text-purple-600 dark:text-purple-400 border-gray-300 dark:border-gray-700 rounded focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="spend-pe-checkbox" className="text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Gastar PE no uso deste poder ({peCost} PE)
            </label>
          </div>
        )}

        {/* ─── Alerta PE insuficiente ───────────────────────────────────── */}
        {!hasEnoughPE && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            PE insuficiente — você tem {currentPE} PE, o poder custa {effectivePECost} PE.
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
                  damageFormula: firstBaseFormula ? firstFormulaSelecionada : undefined,
                  damageModifier: firstHasBaseadoAtributos ? effTeste : 0,
                  isDanoAcoplado,
                });
                setIsDiceRollerOpen(true);
              }}
            >
              <Dices className="w-3 h-3" />
              Teste: {effTeste >= 0 ? `+${effTeste}` : effTeste}
            </Button>

            {damageEffects.map((e: any) => {
              const danoInfo = buscarGrauNaTabela(e.grau);
              const baseFormula = danoInfo ? danoInfo.dano : '';
              const formulaSelecionada = formulasModularizadas[e.id] || e.dadoModularizado || baseFormula;
              const modulacoes = obterModulacoesDeDados(baseFormula);
              const hasBaseadoAtributos = 
                power.globalModifications.some((m: any) => m.modificationBaseId === 'baseado-atributos') ||
                e.modifications?.some((m: any) => m.modificationBaseId === 'baseado-atributos');

              return (
                <div key={e.id} className="flex items-center gap-0 animate-in fade-in duration-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-[10px] gap-1 px-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 active:scale-95 transition-all ${
                      modulacoes.length > 1 ? 'rounded-r-none border-r-0' : ''
                    }`}
                    onClick={() => {
                      let onApplyCallback: ((val: number) => void) | undefined = undefined;
                      let applyLabelText = 'Aplicar na Ficha';
                      
                      const effectBaseId = e.effectBaseId || e.id;
                      const configId = e.configuracaoSelecionada || e.configuracaoId || '';
                      
                      if (effectBaseId === 'fortalecer' && configId === 'pv') {
                        onApplyCallback = async (val: number) => {
                          if (onSync) {
                            await onSync({ tempPvChange: val });
                          }
                        };
                        applyLabelText = 'Aplicar PV Temporário';
                      } else if (effectBaseId === 'fortalecer' && configId === 'pe') {
                        onApplyCallback = async (val: number) => {
                          if (onSync) {
                            await onSync({ tempPeChange: val });
                          }
                        };
                        applyLabelText = 'Aplicar PE Temporário';
                      } else if (effectBaseId === 'recuperacao' && configId === 'dano') {
                        onApplyCallback = async (val: number) => {
                          if (onSync) {
                            await onSync({ pvChange: val });
                          }
                        };
                        applyLabelText = 'Aplicar Cura de PV';
                      } else if (effectBaseId === 'recuperacao' && configId === 'energia') {
                        onApplyCallback = async (val: number) => {
                          if (onSync) {
                            await onSync({ peChange: val });
                          }
                        };
                        applyLabelText = 'Aplicar Restauração de PE';
                      }

                       let finalDamageFormula = formulaSelecionada;
                       if (effectBaseId === 'dano') {
                         const customDescriptor = e.inputCustomizado || e.inputValue;
                         const descriptorVal = customDescriptor ? String(customDescriptor).trim() : (power.dominio?.name || '');
                         if (descriptorVal) {
                           finalDamageFormula += ` [${descriptorVal.toUpperCase()}]`;
                         }
                       }
                       const isRecuperacao = effectBaseId === 'recuperacao';

                      const fortalecerBonuses = obterBonusFortalecerDanoRecuperacao(activePowers, {
                        tipo: 'PODER',
                        dominio: power.dominio?.name,
                        originItemId: (power as any).originItemId
                      }, character);

                      for (const fb of fortalecerBonuses) {
                        if (!isRecuperacao && fb.configId === 'dano') {
                          const descSuffix = fb.descritor ? ` [${fb.descritor}]` : '';
                          finalDamageFormula += ` + ${fb.formula.replace(/^\+/, '')}${descSuffix}`;
                        } else if (isRecuperacao && fb.configId === 'recuperacao') {
                          const descSuffix = fb.descritor ? ` [${fb.descritor}]` : '';
                          finalDamageFormula += ` + ${fb.formula.replace(/^\+/, '')}${descSuffix}`;
                        }
                      }

                      setDiceRollerConfig({
                        label: `${effectBaseId === 'recuperacao' ? 'Cura' : 'Efeito'}: ${power.nome}${e.nota ? ` (${e.nota})` : ''}`,
                        damageFormula: finalDamageFormula,
                        damageModifier: hasBaseadoAtributos ? effTeste : 0,
                        onlyDamage: true,
                        rollButtonLabel: effectBaseId === 'recuperacao' ? 'Rolar Cura' : 'Rolar Efeito',
                        isDanoAcoplado,
                        onApply: onApplyCallback,
                        applyLabel: applyLabelText,
                        onRoll: () => {
                          if (onDeactivate && activePowers) {
                            for (const ap of activePowers) {
                              if (ap.duracao === 0) {
                                const efeitos = ap.efeitos || ap.effects;
                                if (!efeitos || !Array.isArray(efeitos)) continue;

                                let matches = false;
                                for (const ef of efeitos) {
                                  const baseId = ef.efeitoBaseId || ef.effectBaseId;
                                  const configId = ef.configuracaoSelecionada || ef.configuracaoId;

                                  if (baseId === 'fortalecer' && (configId === 'dano' || configId === 'recuperacao')) {
                                    const inputValue = ef.inputCustomizado || ef.inputValue;
                                    if (!inputValue) continue;
                                    try {
                                      const parsed = JSON.parse(String(inputValue));
                                      if (parsed && parsed.alvo && fortaleceAlvoMatch(parsed.alvo, { tipo: 'PODER', dominio: power.dominio?.name, originItemId: (power as any).originItemId }, ap.originItemId)) {
                                        matches = true;
                                        break;
                                      }
                                    } catch {}
                                  }
                                }
                                if (matches) {
                                  onDeactivate(ap.id);
                                }
                              }
                            }
                          }
                        }
                      });
                      setIsDiceRollerOpen(true);
                    }}
                  >
                    <Dices className="w-3 h-3 text-amber-500" />
                    Dado: {formulaSelecionada} {e.nota ? `(${e.nota})` : ''}
                  </Button>
                  {modulacoes.length > 1 && (
                    <select
                      className="h-7 text-[10px] bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-500 rounded-l-none px-1 py-0 focus:outline-none cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all font-bold"
                      value={formulaSelecionada}
                      onChange={(evt) => setFormulasModularizadas(prev => ({ ...prev, [e.id]: evt.target.value }))}
                    >
                      {modulacoes.map((opt) => (
                        <option key={opt.formula} value={opt.formula}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
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
          onClick={() => onConfirm({ spendPE })}
          loading={isConfirming}
          disabled={!hasEnoughPE || isConfirming || isResolving}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Play className="w-4 h-4" />
          {showOptionalPE ? (effectivePECost > 0 ? `Usar (−${effectivePECost} PE)` : 'Usar') : (peCost > 0 ? `Usar (−${peCost} PE)` : 'Ativar')}
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
