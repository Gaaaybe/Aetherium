/**
 * Hook principal da Calculadora de Personagem
 * Gerencia estado e cálculos automatizados
 * 
 * Segue padrão de usePoderCalculator
 */

import { useState, useMemo, useCallback } from 'react';
import type { Personagem, PersonagemCalculado, Attributes, AttributeTempBonuses, SkillName } from '../types';
import {
  calcularModificadores,
  calcularPontosAtributoDisponiveis,
  calcularPVMax,
  calcularPEMax,
  calcularCD,
  calcularRankCalamidade,
  calcularPdATotal,
  buscarBonusEficiencia,
  calcularBonusPericia,
  calcularRDBloqueio,
  calcularPdAUsados,
  calcularEspacosUsados,
  calcularEspacosDisponiveis,
} from '../regras/calculadoraPersonagem';
import { ALL_SKILLS } from '../types/skillsMap';

// ========================================
// ESTADO INICIAL
// ========================================

function criarPersonagemInicial(): Personagem {
  const agora = new Date().toISOString();
  
  // Criar skills vazias
  const skills: Personagem['skills'] = {};
  ALL_SKILLS.forEach(skill => {
    skills[skill] = {
      id: skill,
      isEfficient: false,
      isInefficient: false,
      trainingLevel: 0,
      miscBonus: 0,
    };
  });
  
  // Atributos iniciais (10 em todos)
  const atributosIniciais: Attributes = {
    Força: 10,
    Destreza: 10,
    Constituição: 10,
    Inteligência: 10,
    Sabedoria: 10,
    Carisma: 10,
  };
  
  // Calcular modificadores iniciais
  const modsIniciais = calcularModificadores(atributosIniciais, {
    Força: 0,
    Destreza: 0,
    Constituição: 0,
    Inteligência: 0,
    Sabedoria: 0,
    Carisma: 0,
  });
  
  // Calcular vitais iniciais (nível 1, atributos padrão)
  const nivelInicial = 1;
  const pvMaxInicial = calcularPVMax(nivelInicial, modsIniciais.Constituição);
  const peMaxInicial = calcularPEMax(modsIniciais.Inteligência, modsIniciais.Destreza);
  
  return {
    id: `char-${Date.now()}`,
    header: {
      name: 'Novo Personagem',
      identity: '',
      origin: '',
      level: nivelInicial,
      // calamityRank removido - agora é calculado automaticamente
      keyAttributeMental: 'Inteligência',
      keyAttributePhysical: 'Destreza',
      inspiration: 0,
      runics: 0,
      complications: [],
      motivations: [],
      resistancesImmunities: '',
    },
    attributes: atributosIniciais,
    attributeTempBonuses: {
      Força: 0,
      Destreza: 0,
      Constituição: 0,
      Inteligência: 0,
      Sabedoria: 0,
      Carisma: 0,
    },
    vitals: {
      pv: {
        current: pvMaxInicial,
        max: pvMaxInicial,
        temp: 0,
      },
      pe: {
        current: peMaxInicial,
        max: peMaxInicial,
        temp: 0,
      },
      deathCounters: 0,
    },
    skills,
    poderes: [],
    inventory: {
      equipped: {
        mainHand: null,
        offHand: null,
        extraHands: [],
        suit: null,
        accessory: null,
      },
      quickSlots: Array(6).fill(null),
      backpack: [],
    },
    pdaTotal: 15,
    pdaExtras: 0,
    espacosDisponiveis: 10,
    deslocamento: 9,
    dataCriacao: agora,
    dataModificacao: agora,
  };
}

// ========================================
// HOOK PRINCIPAL
// ========================================

export function usePersonagemCalculator(personagemInicial?: Personagem) {
  const [personagem, setPersonagem] = useState<Personagem>(
    () => personagemInicial || criarPersonagemInicial()
  );
  
  // ========================================
  // CÁLCULOS DERIVADOS (MEMOIZADOS)
  // ========================================
  
  const calculado = useMemo<PersonagemCalculado>(() => {
    const mods = calcularModificadores(personagem.attributes, personagem.attributeTempBonuses);
    const bonusEficiencia = buscarBonusEficiencia(personagem.header.level);
    
    // Rank de Calamidade (calculado automaticamente)
    const calamityRank = calcularRankCalamidade(personagem.header.level);
    
    // PdA Total (calculado automaticamente)
    const pdaTotal = calcularPdATotal(personagem.header.level, personagem.pdaExtras);
    
    // Pontos de Atributo disponíveis
    const pontosAtributoDisponiveis = calcularPontosAtributoDisponiveis(
      personagem.header.level,
      personagem.attributes
    );
    
    // Classe de Dificuldade
    const modMental = mods[personagem.header.keyAttributeMental];
    const modPhysical = mods[personagem.header.keyAttributePhysical];
    
    const cdMental = calcularCD(personagem.header.level, modMental);
    const cdPhysical = calcularCD(personagem.header.level, modPhysical);
    
    // Vitais Máximos
    const pvMax = calcularPVMax(personagem.header.level, mods.Constituição);
    const peMax = calcularPEMax(modMental, modPhysical);
    
    // PdA e Espaços
    const pdaUsados = calcularPdAUsados(personagem.poderes);
    const espacosUsados = calcularEspacosUsados(personagem.poderes);
    const espacosDisponiveis = calcularEspacosDisponiveis(mods.Inteligência);
    
    // Bônus de Fortitude (para RD)
    const bonusFortitude = calcularBonusPericia(
      personagem.skills.Fortitude,
      'Fortitude',
      mods,
      bonusEficiencia
    );
    
    // RD (TODO: calcular poderes passivos)
    const rdPoderesPassivos = 0; // Placeholder
    const rdBloqueio = calcularRDBloqueio(
      personagem.inventory.equipped.suit,
      personagem.inventory.equipped.mainHand,
      personagem.inventory.equipped.offHand,
      personagem.inventory.equipped.extraHands,
      bonusFortitude, // Bônus total de Fortitude
      rdPoderesPassivos
    );
    
    return {
      modificadores: mods,
      calamityRank,
      pdaTotal,
      pontosAtributoDisponiveis,
      pvMax,
      peMax,
      deslocamento: personagem.deslocamento,
      cdMental,
      cdPhysical,
      pdaUsados,
      pdaDisponiveis: pdaTotal - pdaUsados,
      espacosDisponiveis,
      espacosUsados,
      rdBloqueio,
      bonusEficiencia,
    };
  }, [
    personagem.attributes,
    personagem.attributeTempBonuses,
    personagem.header.level,
    personagem.header.keyAttributeMental,
    personagem.header.keyAttributePhysical,
    personagem.poderes,
    personagem.pdaExtras,
    personagem.inventory.equipped,
    personagem.deslocamento,
    personagem.skills.Fortitude,
  ]);
  
  // ========================================
  // AÇÕES DE MODIFICAÇÃO
  // ========================================
  
  const atualizarNivel = useCallback((nivel: number) => {
    setPersonagem(prev => ({
      ...prev,
      header: { ...prev.header, level: nivel },
      dataModificacao: new Date().toISOString(),
    }));
  }, []);
  
  const atualizarAtributo = useCallback((atributo: keyof Attributes, valor: number) => {
    setPersonagem(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [atributo]: valor },
      dataModificacao: new Date().toISOString(),
    }));
  }, []);
  
  const atualizarBonusTemp = useCallback((atributo: keyof AttributeTempBonuses, valor: number) => {
    setPersonagem(prev => ({
      ...prev,
      attributeTempBonuses: { ...prev.attributeTempBonuses, [atributo]: valor },
      dataModificacao: new Date().toISOString(),
    }));
  }, []);
  
  const atualizarPV = useCallback((valor: number, tipo: 'current' | 'temp') => {
    setPersonagem(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        pv: { ...prev.vitals.pv, [tipo]: Math.max(0, valor) },
      },
      dataModificacao: new Date().toISOString(),
    }));
  }, []);
  
  const atualizarPE = useCallback((valor: number, tipo: 'current' | 'temp') => {
    setPersonagem(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        pe: { ...prev.vitals.pe, [tipo]: Math.max(0, valor) },
      },
      dataModificacao: new Date().toISOString(),
    }));
  }, []);
  
  const atualizarPericia = useCallback((skillName: SkillName, updates: Partial<Personagem['skills'][string]>) => {
    setPersonagem(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: { ...prev.skills[skillName], ...updates },
      },
      dataModificacao: new Date().toISOString(),
    }));
  }, []);
  
  const resetarPersonagem = useCallback(() => {
    setPersonagem(criarPersonagemInicial());
  }, []);
  
  const carregarPersonagem = useCallback((novoPersonagem: Personagem) => {
    setPersonagem(novoPersonagem);
  }, []);
  
  // ========================================
  // HELPER: CALCULAR BÔNUS DE PERÍCIA
  // ========================================
  
  const obterBonusPericia = useCallback((skillName: SkillName): number => {
    const skill = personagem.skills[skillName];
    if (!skill) return 0;
    
    return calcularBonusPericia(
      skill,
      skillName,
      calculado.modificadores,
      calculado.bonusEficiencia,
      personagem.header.keyAttributeMental,
      personagem.header.keyAttributePhysical
    );
  }, [personagem.skills, personagem.header.keyAttributeMental, personagem.header.keyAttributePhysical, calculado.modificadores, calculado.bonusEficiencia]);
  
  // ========================================
  // RETORNO
  // ========================================
  
  return {
    personagem,
    calculado,
    
    // Ações
    setPersonagem,
    atualizarNivel,
    atualizarAtributo,
    atualizarBonusTemp,
    atualizarPV,
    atualizarPE,
    atualizarPericia,
    resetarPersonagem,
    carregarPersonagem,
    
    // Helpers
    obterBonusPericia,
  };
}
