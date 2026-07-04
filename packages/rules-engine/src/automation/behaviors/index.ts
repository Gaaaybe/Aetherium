import type { EfeitoBehavior, GameMutation, PowerUseContext } from '../types.js';
import { executeDano } from './dano.behavior.js';
import { executeRecuperacao } from './recuperacao.behavior.js';
import { executeMarcador } from './marcador.behavior.js';
import { executeGatilho } from './gatilho.behavior.js';
import { executeFortalecer } from './fortalecer.behavior.js';
import { executeAfligir } from './afligir.behavior.js';

/**
 * Dispatch central de executores por kind.
 * Para adicionar um novo kind: criar o arquivo, importar aqui e adicionar o case.
 * Kinds passivos e NARRATIVO não produzem GameMutation — retornam [].
 */
export function executeBehavior(
  behavior: EfeitoBehavior,
  targets: string[],
  grau: number,
  context: PowerUseContext,
  sourcePowerId: string,
  basedOnAttribute = false,
  dadoModularizado?: string,
  isDanoAcoplado = false,
): GameMutation[] {
  switch (behavior.kind) {
    case 'DANO':
      return executeDano(behavior, targets, grau, context, basedOnAttribute, dadoModularizado, isDanoAcoplado);

    case 'RECUPERACAO':
      return executeRecuperacao(behavior, targets);

    case 'MARCADOR':
      return executeMarcador(behavior, targets, sourcePowerId);

    case 'GATILHO':
      return executeGatilho(behavior, targets, sourcePowerId);

    case 'FORTALECER':
      return executeFortalecer(behavior, targets, grau, context, basedOnAttribute);

    case 'APLICAR_CONDICAO':
      return executeAfligir(behavior, targets);

    case 'BONUS_ROLAGEM':
    case 'MODIFICADOR_RECURSO':
    case 'BLOQUEIO_RECUPERACAO':
    case 'MODIFICADOR_MOVIMENTO':
    case 'VULNERABILIDADE_DESCRITOR':
      // Passivos — resolvePassiveModifiers cuida deles
      return [];

    case 'NARRATIVO':
      return [];

    default: {
      // Garante exaustividade: erro de compilação se novo kind não for tratado
      const _exhaustive: never = behavior;
      void _exhaustive;
      return [];
    }
  }
}

