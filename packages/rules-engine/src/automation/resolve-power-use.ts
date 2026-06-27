import type { ResolvedPower, PowerUseContext, GameMutation } from './types.js';
import { executeBehavior } from './behaviors/index.js';
import { limitadoTransform, seletivoTransform } from './targeting/index.js';

export interface PowerUseInput {
  power: ResolvedPower;
  context: PowerUseContext;
  /** IDs escolhidos pelo jogador para modificações SELETIVO */
  selectedTargetIds?: string[];
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
 * Depois de todos os efeitos:
 *   5. Aplica efeito colateral no caster (se houver)
 */
export function resolvePowerUse({ power, context, selectedTargetIds }: PowerUseInput): GameMutation[] {
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

    // 4. Executa o behavior contra os alvos filtrados
    mutations.push(...executeBehavior(behavior, targets, effect.grau, context, power.id, basedOnAttribute));

  }

  // 4. Efeito colateral no caster (verifica modificações globais)
  // Break após o primeiro encontrado — um único efeito colateral por uso.
  for (const mod of power.globalModifications) {
    const isColateralSempre = mod.casterEffect === 'EFEITO_COLATERAL_SEMPRE';
    const isColateralAoFalhar =
      mod.casterEffect === 'EFEITO_COLATERAL_AO_FALHAR' && context.attackSucceeded === false;

    if (isColateralSempre || isColateralAoFalhar) {
      mutations.push({
        type: 'DEAL_DAMAGE',
        targetId: context.casterId,
        formula: power.colateralFormula ?? '2d8',
        damageType: 'sombrio',
        isSelfInflicted: true,
      });
      break;
    }
  }

  return mutations;
}
