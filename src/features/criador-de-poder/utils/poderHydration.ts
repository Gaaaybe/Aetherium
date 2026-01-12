/**
 * Sistema de Hydration e Compatibilidade de Poderes
 * 
 * Garante que poderes salvos em versões antigas continuem funcionando
 * após mudanças no sistema de dados ou lógica de cálculo.
 */

import { Poder, ModificacaoAplicada, EfeitoAplicado } from '../regras/calculadoraCusto';
import { EFEITOS, MODIFICACOES } from '../../../data';

// Versão atual do schema de poderes
export const SCHEMA_VERSION = '1.0.0';

export interface PoderComVersion extends Poder {
  schemaVersion?: string;
}

export interface HydrationResult {
  poder: Poder;
  warnings: string[];
  changes: string[];
}

/**
 * Valida e atualiza um poder carregado do localStorage
 * 
 * - Remove efeitos/modificações com IDs inexistentes
 * - Limpa parâmetros inválidos
 * - Adiciona campos faltantes com valores padrão
 * - Atualiza para a versão atual do schema
 */
export function hydratePoder(poderSalvo: PoderComVersion): HydrationResult {
  const warnings: string[] = [];
  const changes: string[] = [];
  
  // Cria uma cópia profunda para não mutar o original
  const poder = JSON.parse(JSON.stringify(poderSalvo)) as Poder;
  
  // 1. Verificar versão do schema
  if (!poderSalvo.schemaVersion) {
    changes.push('Poder atualizado para o schema atual');
  } else if (poderSalvo.schemaVersion !== SCHEMA_VERSION) {
    changes.push(`Schema atualizado de ${poderSalvo.schemaVersion} para ${SCHEMA_VERSION}`);
  }
  
  // 2. Validar e limpar efeitos
  const efeitosValidos: EfeitoAplicado[] = [];
  
  for (const efeito of poder.efeitos || []) {
    const efeitoBase = EFEITOS.find(e => e.id === efeito.efeitoBaseId);
    
    if (!efeitoBase) {
      warnings.push(`Efeito removido: "${efeito.efeitoBaseId}" não existe mais no sistema`);
      continue;
    }
    
    // Valida grau
    if (typeof efeito.grau !== 'number' || isNaN(efeito.grau) || efeito.grau < 1) {
      efeito.grau = 1;
      changes.push(`Grau inválido corrigido para 1 no efeito ${efeitoBase.nome}`);
    }
    
    // Valida modificações locais
    efeito.modificacoesLocais = validarModificacoes(
      efeito.modificacoesLocais || [],
      `efeito ${efeitoBase.nome}`,
      warnings,
      changes
    );
    
    efeitosValidos.push(efeito);
  }
  
  poder.efeitos = efeitosValidos;
  
  // 3. Validar e limpar modificações globais
  poder.modificacoesGlobais = validarModificacoes(
    poder.modificacoesGlobais || [],
    'modificações globais',
    warnings,
    changes
  );
  
  // 4. Validar parâmetros do poder
  poder.acao = validarParametro(poder.acao);
  poder.alcance = validarParametro(poder.alcance);
  poder.duracao = validarParametro(poder.duracao);
  
  // 5. Garantir campos obrigatórios
  if (!poder.nome) poder.nome = 'Poder sem nome';
  if (!poder.descricao) poder.descricao = '';
  if (!poder.id) poder.id = Date.now().toString();
  
  // 6. Validar custo alternativo (se existir)
  if (poder.custoAlternativo) {
    if (!['pe', 'atributo', 'item', 'material'].includes(poder.custoAlternativo.tipo)) {
      delete poder.custoAlternativo;
      changes.push('Custo alternativo inválido removido');
    }
  }
  
  return {
    poder: { ...poder, schemaVersion: SCHEMA_VERSION } as PoderComVersion,
    warnings,
    changes
  };
}

/**
 * Valida uma lista de modificações aplicadas
 */
function validarModificacoes(
  modificacoes: ModificacaoAplicada[],
  contexto: string,
  warnings: string[],
  changes: string[]
): ModificacaoAplicada[] {
  const modificacoesValidas: ModificacaoAplicada[] = [];
  
  for (const mod of modificacoes) {
    const modBase = MODIFICACOES.find(m => m.id === mod.modificacaoBaseId);
    
    if (!modBase) {
      warnings.push(`Modificação removida de ${contexto}: "${mod.modificacaoBaseId}" não existe mais`);
      continue;
    }
    
    // Valida grau da modificação
    if (modBase.tipoParametro === 'grau') {
      if (!mod.grauModificacao || mod.grauModificacao < (modBase.grauMinimo || 1)) {
        mod.grauModificacao = modBase.grauMinimo || 1;
        changes.push(`Grau da modificação ${modBase.nome} corrigido`);
      }
      if (modBase.grauMaximo && mod.grauModificacao > modBase.grauMaximo) {
        mod.grauModificacao = modBase.grauMaximo;
        changes.push(`Grau da modificação ${modBase.nome} ajustado para o máximo`);
      }
    }
    
    // Valida parâmetros
    if (mod.parametros) {
      // Remove parâmetros desnecessários se a modificação não requer
      if (!modBase.requerParametros) {
        delete mod.parametros;
        changes.push(`Parâmetros desnecessários removidos de ${modBase.nome}`);
      } else {
        // Valida configuração selecionada (somente se ainda temos parâmetros)
        if (mod.parametros?.configuracaoSelecionada && modBase.configuracoes?.opcoes) {
          const configValida = modBase.configuracoes.opcoes.find(
            opt => opt.id === mod.parametros!.configuracaoSelecionada
          );
          if (!configValida) {
            delete mod.parametros.configuracaoSelecionada;
            warnings.push(`Configuração inválida removida de ${modBase.nome}`);
          }
        }
      }
    }
    
    // Se a modificação agora requer configuração mas o poder antigo não tinha, adiciona padrão
    if (modBase.requerParametros && modBase.configuracoes?.opcoes && modBase.configuracoes.tipo === 'select') {
      if (!mod.parametros) {
        mod.parametros = {};
      }
      if (!mod.parametros.configuracaoSelecionada) {
        // Define a primeira opção como padrão
        const opcaoPadrao = modBase.configuracoes.opcoes[0];
        mod.parametros.configuracaoSelecionada = opcaoPadrao.id;
        changes.push(`Configuração padrão "${opcaoPadrao.nome}" adicionada a ${modBase.nome}`);
      }
    }
    
    modificacoesValidas.push(mod);
  }
  
  return modificacoesValidas;
}

/**
 * Valida um parâmetro (ação, alcance, duração)
 */
function validarParametro(valor: unknown): number {
  if (typeof valor !== 'number' || isNaN(valor) || valor < 0) {
    return 0;
  }
  return Math.floor(valor);
}

/**
 * Verifica se um poder precisa ser atualizado
 */
export function precisaHydration(poder: PoderComVersion): boolean {
  // Verifica versão
  if (!poder.schemaVersion || poder.schemaVersion !== SCHEMA_VERSION) {
    return true;
  }
  
  // Verifica se há efeitos inválidos
  if (poder.efeitos) {
    for (const efeito of poder.efeitos) {
      const efeitoBase = EFEITOS.find(e => e.id === efeito.efeitoBaseId);
      if (!efeitoBase) return true;
      
      // Verifica modificações locais
      if (efeito.modificacoesLocais) {
        for (const mod of efeito.modificacoesLocais) {
          const modBase = MODIFICACOES.find(m => m.id === mod.modificacaoBaseId);
          if (!modBase) return true;
        }
      }
    }
  }
  
  // Verifica modificações globais
  if (poder.modificacoesGlobais) {
    for (const mod of poder.modificacoesGlobais) {
      const modBase = MODIFICACOES.find(m => m.id === mod.modificacaoBaseId);
      if (!modBase) return true;
    }
  }
  
  return false;
}

/**
 * Formata warnings e changes para exibição ao usuário
 */
export function formatarMensagensHydration(result: HydrationResult): {
  hasIssues: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
} {
  const hasWarnings = result.warnings.length > 0;
  const hasChanges = result.changes.length > 0;
  
  if (!hasWarnings && !hasChanges) {
    return {
      hasIssues: false,
      message: '',
      severity: 'info'
    };
  }
  
  let message = '';
  let severity: 'info' | 'warning' | 'error' = 'info';
  
  if (hasWarnings) {
    severity = 'warning';
    message += '⚠️ Alguns itens foram removidos porque não existem mais no sistema:\n';
    message += result.warnings.map(w => `• ${w}`).join('\n');
  }
  
  if (hasChanges) {
    if (message) message += '\n\n';
    message += 'ℹ️ Atualizações aplicadas:\n';
    message += result.changes.map(c => `• ${c}`).join('\n');
  }
  
  if (!hasWarnings && hasChanges) {
    message = '✅ Poder atualizado com sucesso para a versão atual do sistema.';
  }
  
  return {
    hasIssues: true,
    message,
    severity
  };
}
