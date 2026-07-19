import type { ResolvedPower, PowerUseContext, GameMutation } from './types.js';
import { executeBehavior } from './behaviors/index.js';
import { limitadoTransform, seletivoTransform } from './targeting/index.js';

export interface PowerUseInput {
  power: ResolvedPower;
  context: PowerUseContext;
  /** IDs escolhidos pelo jogador para modificações SELETIVO */
  selectedTargetIds?: string[];
  descargaMultiplier?: number;
  gradativoProgress?: {
    global?: number;
    effects?: Record<string, number>;
  };
}

export interface GradativoStage {
  progress: number;
  effectiveDegree: number;
  excessiveSteps: number;
}

export function resolveGradativoStage(maxDegree: number, progress: number): GradativoStage {
  const safeMaxDegree = Math.max(1, Math.trunc(maxDegree));
  const safeProgress = Math.max(1, Math.trunc(progress));

  return {
    progress: Math.min(safeProgress, safeMaxDegree + 10),
    effectiveDegree: Math.min(safeProgress, safeMaxDegree),
    excessiveSteps: Math.min(10, Math.max(0, safeProgress - safeMaxDegree)),
  };
}

export function applyGradativoExcessToFormula(formula: string, excessiveSteps: number): string {
  const safeSteps = Math.min(10, Math.max(0, Math.trunc(excessiveSteps)));
  if (!formula || safeSteps === 0) return formula;

  const diceMatch = formula.match(/(\d+)?d(\d+)/i);
  if (diceMatch) {
    const diceCount = diceMatch[1] ? Number.parseInt(diceMatch[1], 10) : 1;
    const faces = Number.parseInt(diceMatch[2], 10);
    const maximumCharacteristic = diceCount * faces;
    const excessiveBonus = Math.floor(maximumCharacteristic / 2) * safeSteps;
    const finalCharacteristic = maximumCharacteristic + excessiveBonus;
    const finalDice = finalCharacteristic % diceCount === 0
      ? `${diceCount}d${finalCharacteristic / diceCount}`
      : `1d${finalCharacteristic}`;

    return formula.replace(diceMatch[0], finalDice);
  }

  if (/^\s*\d+\s*$/.test(formula)) {
    const maximumCharacteristic = Number.parseInt(formula.trim(), 10);
    return String(maximumCharacteristic + Math.floor(maximumCharacteristic / 2) * safeSteps);
  }

  return formula;
}

export function applyDescargaToFormula(formula: string, multiplier: number): string {
  if (!formula) return formula;

  const safeMultiplier = Math.max(1, Math.trunc(multiplier));
  if (safeMultiplier === 1) return formula;

  const terms = formula.match(/([+-]?\s*[^+-]+)/g);
  if (!terms) return formula;

  const diceTerms = terms.filter((term) =>
    /^([+-])?\s*(\d+)?d\d+$/i.test(term.trim()),
  );
  const fixedTerms = terms.filter((term) =>
    !/^([+-])?\s*(\d+)?d\d+$/i.test(term.trim()),
  );

  if (diceTerms.length === 0) {
    return formula;
  }

  const repeatedRolls = Array.from({ length: safeMultiplier }, () =>
    diceTerms.map((term) => term.trim().replace(/^\+\s*/, '')).join(' + '),
  );
  const fixedSuffix = fixedTerms.map((term) => term.trim()).join(' ');

  return `${repeatedRolls.join(' + ')}${fixedSuffix ? ` ${fixedSuffix}` : ''}`;
}

function getDescargaDegree(effect: ResolvedPower['effects'][number], power: ResolvedPower): number {
  const degrees = [...effect.modifications, ...power.globalModifications]
    .filter((modification) => modification.modificationBaseId === 'descarga')
    .map((modification) => modification.grau);

  return degrees.length > 0 ? Math.max(...degrees) : 0;
}

function supportsDescarga(effect: ResolvedPower['effects'][number]): boolean {
  return effect.behavior?.kind === 'DANO' ||
    (effect.behavior?.kind === 'RECUPERACAO' && effect.behavior.recurso === 'PV');
}

function getGradativoProgress(
  effect: ResolvedPower['effects'][number],
  power: ResolvedPower,
  progress: PowerUseInput['gradativoProgress'],
): number | null {
  const hasLocal = effect.modifications.some(
    (modification) => modification.modificationBaseId === 'gradativo',
  );
  if (hasLocal) return progress?.effects?.[effect.id] ?? 1;

  const hasGlobal = power.globalModifications.some(
    (modification) => modification.modificationBaseId === 'gradativo',
  );
  if (hasGlobal) return progress?.global ?? 1;

  return null;
}

/**
 * Pipeline principal de resolução ON_USE.
 * Recebe um poder hidratado + contexto de cena e devolve GameMutation[].
 * Não aplica nada — só produz a lista de mutações para o backend executar.
 *
 * Fluxo por efeito:
 *   1. Ignora behaviors nulos, NARRATIVO e GATILHO (Fase 2)
 *   2. Começa com candidateTargetIds
 *   3. Aplica transforms de targeting das modificações locais
 *   4. Executa o behavior contra os alvos filtrados
 */
export function resolvePowerUse({ power, context, selectedTargetIds, descargaMultiplier, gradativoProgress }: PowerUseInput): GameMutation[] {
  const mutations: GameMutation[] = [];

  for (const effect of power.effects) {
    const { behavior } = effect;

    // Sem behavior ou narrativo → narrador resolve na mesa
    if (!behavior || behavior.kind === 'NARRATIVO') continue;

    // Gatilhos agora são processados para gerar mutação REGISTER_TRIGGER

    // Passivos não produzem GameMutation via ON_USE — resolvePassiveModifiers cuida deles
    if (
      behavior.kind === 'BONUS_ROLAGEM' ||
      behavior.kind === 'MODIFICADOR_RECURSO' ||
      behavior.kind === 'BLOQUEIO_RECUPERACAO' ||
      behavior.kind === 'MODIFICADOR_MOVIMENTO' ||
      behavior.kind === 'VULNERABILIDADE_DESCRITOR'
    ) continue;

    // 1. Começa com todos os candidatos
    let targets = [...context.candidateTargetIds];

    // 2. Aplica transformações de targeting das modificações locais (na ordem de posicao)
    for (const mod of effect.modifications) {
      if (mod.targetingEffect === 'LIMITADO' && mod.markerCondition) {
        targets = limitadoTransform(mod.markerCondition)(targets, context);
      }
      if (mod.targetingEffect === 'SELETIVO' && selectedTargetIds) {
        targets = seletivoTransform(selectedTargetIds)(targets, context);
      }
      // AREA: candidateTargetIds já chegam corretos por geometria externa
    }

    // 3. Detecta modificação baseado-atributos para passar ao executor de DANO
    const basedOnAttribute = effect.modifications.some(
      (m) => m.modificationBaseId === 'baseado-atributos',
    );

    // 4. Gradativo começa no grau 1 e pode acumular até 10 avanços excessivos.
    const effectProgress = getGradativoProgress(effect, power, gradativoProgress);
    const gradativoStage = effectProgress === null
      ? null
      : resolveGradativoStage(effect.grau, effectProgress);
    const effectiveGrau = gradativoStage?.effectiveDegree ?? effect.grau;

    const effectMutations = executeBehavior(
      behavior,
      targets,
      effectiveGrau,
      context,
      power.id,
      basedOnAttribute,
      effectiveGrau === effect.grau ? effect.dadoModularizado : undefined,
      power.isDanoAcoplado,
      power.isRecuperacaoAcoplada
    );

    if (gradativoStage && gradativoStage.excessiveSteps > 0) {
      for (const mutation of effectMutations) {
        if ('formula' in mutation && mutation.formula) {
          mutation.formula = applyGradativoExcessToFormula(
            mutation.formula,
            gradativoStage.excessiveSteps,
          );
        }
      }
    }

    const descargaDegree = getDescargaDegree(effect, power);
    const effectiveDescargaMultiplier = Math.min(
      Math.max(1, Math.trunc(descargaMultiplier ?? 1)),
      descargaDegree,
    );

    if (
      power.parametros.duracao === 0 &&
      supportsDescarga(effect) &&
      effectiveDescargaMultiplier > 1
    ) {
      for (const mutation of effectMutations) {
        if ('formula' in mutation && mutation.formula) {
          mutation.formula = applyDescargaToFormula(mutation.formula, effectiveDescargaMultiplier);
        }
      }
    }

    mutations.push(...effectMutations);

  }

  return mutations;
}
