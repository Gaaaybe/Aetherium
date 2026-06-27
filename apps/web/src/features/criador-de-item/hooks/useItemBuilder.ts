import { useItemCreatorStore } from '@/stores/item-creator.store';
import type { CreateItemPayload } from '@/services/types';

export { UPGRADE_PATAMARES } from '@/stores/item-creator.store';
export type { UpgradePatamarId } from '@/stores/item-creator.store';

export function useItemBuilder() {
  const store = useItemCreatorStore();

  const getValidationErrors = () => {
    const errors: string[] = [];
    const state = store.state;

    if (state.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres.');
    }
    if (state.nome.trim().length > 100) {
      errors.push('Nome não pode exceder 100 caracteres.');
    }

    if (state.descricao.trim().length < 10) {
      errors.push('Descrição deve ter pelo menos 10 caracteres.');
    }
    if (state.descricao.trim().length > 1000) {
      errors.push('Descrição não pode exceder 1000 caracteres.');
    }

    if (state.dominio.name === 'cientifico' && !state.dominio.areaConhecimento) {
      errors.push('Área de conhecimento é obrigatória para domínio Científico.');
    }

    if (state.dominio.name === 'peculiar' && !state.dominio.peculiarId) {
      errors.push('Peculiaridade é obrigatória para domínio Peculiar.');
    }

    if (state.tipo === 'consumable' && state.consumable.descritorEfeito.trim().length === 0) {
      errors.push('Consumível exige descritor de efeito.');
    }

    if (state.tipo === 'weapon') {
      const hasInvalidDamage = state.weapon.danos.some((d) => !d.dado.trim() || !d.base.trim());
      if (hasInvalidDamage) {
        errors.push('Preencha dado e base em todos os danos da arma.');
      }

      if (state.weapon.alcance !== 'natural' && state.weapon.alcanceExtraMetros > 0) {
        errors.push('Apenas armas de alcance natural podem ter alcance extra.');
      }

      if (!Number.isInteger(state.weapon.alcanceExtraMetros * 2)) {
        errors.push('Alcance extra da arma deve usar incrementos de 0,5m.');
      }
    }

    return errors;
  };

  const buildPayload = (): CreateItemPayload => {
    const state = store.state;
    const common = {
      nome: state.nome.trim(),
      descricao: state.descricao.trim(),
      dominio: {
        name: state.dominio.name,
        ...(state.dominio.areaConhecimento && {
          areaConhecimento: state.dominio.areaConhecimento,
        }),
        ...(state.dominio.peculiarId && { peculiarId: state.dominio.peculiarId }),
      },
      custoBase: state.custoBase,
      isPublic: state.isPublic,
      ...(state.notas.trim() && { notas: state.notas.trim() }),
      ...(state.icone.trim() && { icone: state.icone.trim() }),
      ...(state.powerIds.length > 0 && { powerIds: state.powerIds }),
      ...(state.powerArrayIds.length > 0 && { powerArrayIds: state.powerArrayIds }),
    };

    if (state.tipo === 'weapon') {
      return {
        ...common,
        tipo: 'weapon',
        danos: state.weapon.danos,
        critMargin: state.weapon.critMargin,
        critMultiplier: state.weapon.critMultiplier,
        alcance: state.weapon.alcance,
        alcanceExtraMetros:
          state.weapon.alcance === 'natural' ? state.weapon.alcanceExtraMetros : 0,
        ...(state.weapon.atributoEscalonamento.trim() && {
          atributoEscalonamento: state.weapon.atributoEscalonamento.trim(),
        }),
        upgradeLevel: state.weapon.upgradeLevel,
      };
    }

    if (state.tipo === 'defensive-equipment') {
      return {
        ...common,
        tipo: 'defensive-equipment',
        tipoEquipamento: state.defensive.tipoEquipamento,
        baseRD: state.defensive.baseRD,
        ...(state.defensive.atributoEscalonamento.trim() && {
          atributoEscalonamento: state.defensive.atributoEscalonamento.trim(),
        }),
        upgradeLevel: state.defensive.upgradeLevel,
      };
    }

    if (state.tipo === 'consumable') {
      return {
        ...common,
        tipo: 'consumable',
        descritorEfeito: state.consumable.descritorEfeito.trim(),
        qtdDoses: state.consumable.qtdDoses,
        isRefeicao: state.consumable.isRefeicao,
      };
    }

    if (state.tipo === 'artifact') {
      return { ...common, tipo: 'artifact' };
    }

    if (state.tipo === 'accessory') {
      return { ...common, tipo: 'accessory' };
    }

    if (state.tipo === 'general') {
      return { ...common, tipo: 'general' };
    }

    return {
      ...common,
      tipo: 'upgrade-material',
      tier: state.upgradeMaterial.tier,
      maxUpgradeLimit: state.upgradeMaterial.maxUpgradeLimit,
    };
  };

  return {
    state: store.state,
    updateField: store.updateField,
    updateDomain: store.updateDomain,
    setTipo: store.setTipo,
    togglePower: store.togglePower,
    togglePowerArray: store.togglePowerArray,
    updateWeaponDamage: store.updateWeaponDamage,
    addWeaponDamage: store.addWeaponDamage,
    removeWeaponDamage: store.removeWeaponDamage,
    updateWeaponField: store.updateWeaponField,
    updateDefensiveField: store.updateDefensiveField,
    updateConsumableField: store.updateConsumableField,
    setUpgradeMaterialPatamar: store.setUpgradeMaterialPatamar,
    hydrateFromItem: store.hydrateFromItem,
    getValidationErrors,
    buildPayload,
    reset: store.reset,
  };
}
