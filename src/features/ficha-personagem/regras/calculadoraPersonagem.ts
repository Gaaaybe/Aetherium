/**
 * Funções de Cálculo do Personagem
 * Spirit & Caos RPG System
 * 
 * Funções puras para calcular valores derivados do personagem
 */

import type { 
  Attributes, 
  AttributeName,
  SkillEntry,
  PersonagemPoder,
  Item,
} from '../types';
import { SKILL_ATTRIBUTE_MAP } from '../types/skillsMap';

// ========================================
// MODIFICADORES DE ATRIBUTOS
// ========================================

/**
 * Calcula o modificador de um atributo
 * Fórmula: ARREDONDAR.PARA.CIMA((atributo - 10) / 2; 0)
 */
export function calcularModificador(valorAtributo: number): number {
  return Math.ceil((valorAtributo - 10) / 2);
}

/**
 * Calcula todos os modificadores de atributos
 */
export function calcularModificadores(
  attributes: Attributes,
  tempBonuses?: Partial<Attributes>
): Attributes {
  const modificadores: Attributes = {
    Força: 0,
    Destreza: 0,
    Constituição: 0,
    Inteligência: 0,
    Sabedoria: 0,
    Carisma: 0,
  };

  for (const attr of Object.keys(attributes) as AttributeName[]) {
    const valorBase = attributes[attr];
    const bonus = tempBonuses?.[attr] || 0;
    modificadores[attr] = calcularModificador(valorBase + bonus);
  }

  return modificadores;
}

/**
 * Calcula quantos pontos de atributo estão disponíveis para distribuir
 * Fórmula: (nivel * (nivel + 1) / 2) + (67 - somaAtributos)
 * 
 * Personagens começam com 60 pontos (6 atributos × 10)
 * A cada nível ganham pontos para distribuir
 */
export function calcularPontosAtributoDisponiveis(
  nivel: number,
  attributes: Attributes
): number {
  const somaAtributos = Object.values(attributes).reduce((sum, val) => sum + val, 0);
  const pontosGanhosPorNivel = (nivel * (nivel + 1)) / 2;
  const pontosIniciais = 67; // 60 base + 7 extras para começar acima de 10
  
  return pontosGanhosPorNivel + (pontosIniciais - somaAtributos);
}

// ========================================
// RECURSOS VITAIS
// ========================================

/**
 * Calcula PV Máximo
 * Fórmula: (nível * ModCON) + 6
 * Mínimo: 4 (proteção contra modificador de CON muito negativo)
 */
export function calcularPVMax(nivel: number, modConstituicao: number): number {
  const pvCalculado = (nivel * modConstituicao) + 6;
  return Math.max(4, pvCalculado);
}

/**
 * Calcula PE Máximo
 * Fórmula: ARREDONDAR.PARA.BAIXO(899 * RAIZ((modMental + modFisico) / 15000); 0)
 * Mínimo: 4 (proteção contra modificadores muito negativos)
 * 
 * @param modKeyMental - Modificador do atributo chave mental escolhido
 * @param modKeyPhysical - Modificador do atributo chave físico escolhido
 */
export function calcularPEMax(modKeyMental: number, modKeyPhysical: number): number {
  const peCalculado = Math.floor(899 * Math.sqrt((modKeyMental + modKeyPhysical) / 15000));
  return Math.max(4, peCalculado);
}

// ========================================
// ECONOMIA DE PODER (PdA e Espaços)
// ========================================

/**
 * Calcula PdA Total disponível
 * Fórmula: 15 + ((nivel-1) × 7) + floor(nivel/5) × 7 + extras
 */
export function calcularPdATotal(nivel: number, pdaExtras: number = 0): number {
  const base = 15;
  const porNivel = (nivel - 1) * 7;
  const bonus = Math.floor(nivel / 5) * 7;
  
  return base + porNivel + bonus + pdaExtras;
}

/**
 * Calcula Espaços Disponíveis
 * Fórmula: ARREDONDAR.PARA.BAIXO(899 * RAIZ(modInteligencia / 15000))
 * Mínimo: 4
 */
export function calcularEspacosDisponiveis(modInteligencia: number): number {
  const espacosCalculados = Math.floor(899 * Math.sqrt(modInteligencia / 15000));
  return Math.max(4, espacosCalculados);
}

/**
 * Calcula PdA usados (soma dos custos de todos os poderes)
 */
export function calcularPdAUsados(poderes: PersonagemPoder[]): number {
  return poderes.reduce((total, poder) => total + poder.pdaCost, 0);
}

/**
 * Calcula Espaços usados (soma dos espaços apenas dos poderes ATIVOS)
 */
export function calcularEspacosUsados(poderes: PersonagemPoder[]): number {
  return poderes
    .filter(poder => poder.ativo) // Apenas poderes ativos consomem espaços
    .reduce((total, poder) => total + poder.espacosOccupied, 0);
}

// ========================================
// CLASSE DE DIFICULDADE (CD)
// ========================================

/**
 * Calcula CD (Classe de Dificuldade)
 * Fórmula: 10 + modificador do atributo chave + (nível / 2 arredondado)
 */
export function calcularCD(nivel: number, modAtributoChave: number): number {
  return 10 + modAtributoChave + Math.floor(nivel / 2);
}

// ========================================
// RANK DE CALAMIDADE
// ========================================

/**
 * Determina o Rank de Calamidade baseado no nível
 * Baseado na Tabela Mestra
 */
export function calcularRankCalamidade(nivel: number): string {
  if (nivel <= 0) return 'Desconhecido';
  if (nivel <= 5) return 'Raposa';
  if (nivel <= 10) return 'Lobo';
  if (nivel <= 20) return 'Tigre';
  if (nivel <= 30) return 'Demônio';
  if (nivel <= 40) return 'Dragão';
  if (nivel <= 70) return 'Dragão';
  return 'Celestial';
}

/**
 * Busca o bônus de eficiência baseado no nível
 * Fórmula: ARRED(3000 * (nivel / 250)^2; 0) + 1
 */
export function buscarBonusEficiencia(nivel: number): number {
  return Math.round(3000 * Math.pow(nivel / 250, 2)) + 1;
}

// ========================================
// PERÍCIAS
// ========================================

/**
 * Calcula o bônus total de uma perícia
 * Fórmula: Mod.Atributo + Treino + Misc + Eficiência (se eficiente) - Eficiência (se ineficiente)
 * 
 * Casos especiais:
 * - Atletismo: usa atributo chave físico ao invés de Força
 * - Espiritismo: usa atributo chave mental ao invés de Sabedoria
 */
export function calcularBonusPericia(
  skill: SkillEntry,
  skillName: string,
  modificadores: Attributes,
  bonusEficiencia: number,
  keyAttributeMental?: AttributeName,
  keyAttributePhysical?: AttributeName
): number {
  // Determinar atributo base
  let atributoBase: AttributeName;
  
  // Casos especiais: Atletismo e Espiritismo usam atributo chave
  if (skillName === 'Atletismo' && keyAttributePhysical) {
    atributoBase = keyAttributePhysical;
  } else if (skillName === 'Espiritismo' && keyAttributeMental) {
    atributoBase = keyAttributeMental;
  } else {
    atributoBase = SKILL_ATTRIBUTE_MAP[skillName as keyof typeof SKILL_ATTRIBUTE_MAP];
  }
  
  const modAtributo = atributoBase ? modificadores[atributoBase] : 0;
  
  // Bônus base
  let bonus = modAtributo + skill.trainingLevel + skill.miscBonus;
  
  // Eficiência (adiciona bônus)
  if (skill.isEfficient) {
    bonus += bonusEficiencia;
  }
  
  // Ineficiência (subtrai o bônus de eficiência)
  if (skill.isInefficient) {
    bonus -= bonusEficiencia;
  }
  
  return bonus;
}

// ========================================
// COMBATE E DEFESAS
// ========================================

/**
 * Calcula RD (Redução de Dano) de Bloqueio
 * RD = Traje + Arma/Escudo + Mod.Fortitude + Poderes Passivos
 * 
 * Nota: Poderes passivos devem ser calculados externamente e passados como parâmetro
 */
export function calcularRDBloqueio(
  suit: Item | null,
  armaPrincipal: Item | null,
  armaSecundaria: Item | null,
  maosExtras: Item[],
  modFortitude: number,
  rdPoderesPassivos: number = 0
): number {
  let rd = 0;
  
  // RD do traje (suit)
  if (suit?.bonusRD) {
    rd += suit.bonusRD;
  }
  
  // RD da arma principal (se tiver)
  if (armaPrincipal?.bonusRD) {
    rd += armaPrincipal.bonusRD;
  }
  
  // RD da arma secundária/escudo
  if (armaSecundaria?.bonusRD) {
    rd += armaSecundaria.bonusRD;
  }
  
  // RD de mãos extras (ex: poder Membros Extras com escudos)
  maosExtras.forEach(item => {
    if (item?.bonusRD) {
      rd += item.bonusRD;
    }
  });
  
  // Modificador de Fortitude
  rd += modFortitude;
  
  // Poderes passivos
  rd += rdPoderesPassivos;
  
  return Math.max(0, rd); // Nunca negativo
}

/**
 * Calcula RD sem bloqueio (apenas traje + poderes)
 */
export function calcularRDBase(
  suit: Item | null,
  rdPoderesPassivos: number = 0
): number {
  let rd = 0;
  
  if (suit?.bonusRD) {
    rd += suit.bonusRD;
  }
  
  rd += rdPoderesPassivos;
  
  return Math.max(0, rd);
}

// ========================================
// VALIDAÇÕES
// ========================================

/**
 * Valida se o personagem está dentro do orçamento de PdA
 */
export function validarOrcamentoPdA(
  pdaTotal: number,
  pdaUsados: number
): { isValid: boolean; error?: string } {
  if (pdaUsados > pdaTotal) {
    return {
      isValid: false,
      error: `PdA excedido: ${pdaUsados} / ${pdaTotal}`,
    };
  }
  
  return { isValid: true };
}

/**
 * Valida se o personagem está dentro do limite de espaços
 */
export function validarEspacos(
  espacosDisponiveis: number,
  espacosUsados: number
): { isValid: boolean; error?: string } {
  if (espacosUsados > espacosDisponiveis) {
    return {
      isValid: false,
      error: `Espaços excedidos: ${espacosUsados} / ${espacosDisponiveis}`,
    };
  }
  
  return { isValid: true };
}

/**
 * Valida se um atributo está dentro dos limites válidos
 */
export function validarAtributo(valor: number): { isValid: boolean; error?: string } {
  if (valor < 1 || valor > 30) {
    return {
      isValid: false,
      error: `Atributo deve estar entre 1 e 30 (valor: ${valor})`,
    };
  }
  
  return { isValid: true };
}

/**
 * Valida se o nível está dentro dos limites
 */
export function validarNivel(nivel: number): { isValid: boolean; error?: string } {
  if (nivel < 1 || nivel > 250) {
    return {
      isValid: false,
      error: `Nível deve estar entre 1 e 250 (valor: ${nivel})`,
    };
  }
  
  return { isValid: true };
}
