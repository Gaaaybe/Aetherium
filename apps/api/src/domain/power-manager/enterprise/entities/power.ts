import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { Optional } from '@/core/types/optional';
import { Domain } from './value-objects/domain';
import { PowerParameters } from './value-objects/power-parameters';
import { PowerCost } from './value-objects/power-cost';
import { AlternativeCost } from './value-objects/alternative-cost';
import { AppliedEffect } from './applied-effect';
import { AppliedModification } from './value-objects/applied-modification';
import { PowerEffectList } from './watched-lists/power-effect-list';
import { PowerGlobalModificationList } from './watched-lists/power-global-modification-list';

interface PowerProps {
  nome: string;
  descricao: string;
  dominio: Domain;
  parametros: PowerParameters;
  effects: PowerEffectList;
  globalModifications: PowerGlobalModificationList;
  custoTotal: PowerCost;
  custoAlternativo?: AlternativeCost;
  custom: boolean;
  notas?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class Power extends AggregateRoot<PowerProps> {
  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get dominio(): Domain {
    return this.props.dominio;
  }

  get parametros(): PowerParameters {
    return this.props.parametros;
  }

  get effects(): PowerEffectList {
    return this.props.effects;
  }

  get globalModifications(): PowerGlobalModificationList {
    return this.props.globalModifications;
  }

  get custoTotal(): PowerCost {
    return this.props.custoTotal;
  }

  get custoAlternativo(): AlternativeCost | undefined {
    return this.props.custoAlternativo;
  }

  get custom(): boolean {
    return this.props.custom;
  }

  get notas(): string | undefined {
    return this.props.notas;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  isCustom(): boolean {
    return this.props.custom === true;
  }

  hasAlternativeCost(): boolean {
    return !!this.props.custoAlternativo;
  }

  hasMultipleEffects(): boolean {
    return this.props.effects.getItems().length > 1;
  }

  hasGlobalModifications(): boolean {
    return this.props.globalModifications.getItems().length > 0;
  }

  getEffect(effectId: UniqueEntityId): AppliedEffect | undefined {
    return this.props.effects.getItems().find((effect) => effect.id.equals(effectId));
  }

  getGlobalModification(index: number): AppliedModification | undefined {
    return this.props.globalModifications.getItems()[index];
  }

  addEffect(effect: AppliedEffect): Power {
    const effects = new PowerEffectList(this.props.effects.getItems());
    effects.add(effect);

    return new Power(
      {
        ...this.props,
        effects,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  addGlobalModification(modification: AppliedModification): Power {
    const globalModifications = new PowerGlobalModificationList(
      this.props.globalModifications.getItems(),
    );
    globalModifications.add(modification);

    return new Power(
      {
        ...this.props,
        globalModifications,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  removeEffect(effectId: UniqueEntityId): Power {
    const effect = this.props.effects.getItems().find((e) => e.id.equals(effectId));
    
    if (!effect) {
      throw new Error('Efeito não encontrado');
    }

    const effects = new PowerEffectList(this.props.effects.getItems());
    effects.remove(effect);

    if (effects.getItems().length === 0) {
      throw new Error('Um poder deve ter pelo menos um efeito');
    }

    return new Power(
      {
        ...this.props,
        effects,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  removeGlobalModification(index: number): Power {
    const modification = this.props.globalModifications.getItems()[index];
    
    if (!modification) {
      throw new Error('Modificação global não encontrada');
    }

    const globalModifications = new PowerGlobalModificationList(
      this.props.globalModifications.getItems(),
    );
    globalModifications.remove(modification);

    return new Power(
      {
        ...this.props,
        globalModifications,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateEffect(effectId: UniqueEntityId, updatedEffect: AppliedEffect): Power {
    const currentItems = this.props.effects.getItems();
    const newItems = currentItems.map((effect) =>
      effect.id.equals(effectId) ? updatedEffect : effect,
    );

    const effects = new PowerEffectList();
    effects.update(newItems);

    return new Power(
      {
        ...this.props,
        effects,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateGlobalModification(index: number, updatedModification: AppliedModification): Power {
    const currentItems = this.props.globalModifications.getItems();
    const newItems = currentItems.map((mod, i) => (i === index ? updatedModification : mod));

    const globalModifications = new PowerGlobalModificationList();
    globalModifications.update(newItems);

    return new Power(
      {
        ...this.props,
        globalModifications,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateNome(nome: string): Power {
    if (!nome || nome.trim() === '') {
      throw new Error('Nome do poder não pode ser vazio');
    }

    return new Power(
      {
        ...this.props,
        nome: nome.trim(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateDescricao(descricao: string): Power {
    return new Power(
      {
        ...this.props,
        descricao: descricao.trim(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateDominio(dominio: Domain): Power {
    return new Power(
      {
        ...this.props,
        dominio,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateParametros(parametros: PowerParameters): Power {
    return new Power(
      {
        ...this.props,
        parametros,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateCustoTotal(custoTotal: PowerCost): Power {
    return new Power(
      {
        ...this.props,
        custoTotal,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateCustoAlternativo(custoAlternativo?: AlternativeCost): Power {
    return new Power(
      {
        ...this.props,
        custoAlternativo,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateNotas(notas?: string): Power {
    return new Power(
      {
        ...this.props,
        notas,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  private static validate(props: PowerProps): void {
    if (!props.nome || props.nome.trim() === '') {
      throw new Error('Nome do poder é obrigatório');
    }

    if (props.nome.length > 100) {
      throw new Error('Nome do poder não pode exceder 100 caracteres');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new Error('Descrição do poder é obrigatória');
    }

    const effectItems = props.effects.getItems();
    
    if (effectItems.length === 0) {
      throw new Error('Um poder deve ter pelo menos um efeito');
    }

    if (effectItems.length > 20) {
      throw new Error('Um poder não pode ter mais de 20 efeitos vinculados');
    }

    const globalModItems = props.globalModifications.getItems();
    if (globalModItems.length > 50) {
      throw new Error('Um poder não pode ter mais de 50 modificações globais');
    }
  }

  static create(
    props: Optional<PowerProps, 'custom' | 'createdAt' | 'notas' | 'globalModifications'>,
    id?: UniqueEntityId,
  ): Power {
    const power = new Power(
      {
        ...props,
        custom: props.custom ?? false,
        createdAt: props.createdAt ?? new Date(),
        notas: props.notas,
        globalModifications: props.globalModifications ?? new PowerGlobalModificationList(),
      },
      id,
    );

    this.validate(power.props);

    return power;
  }

  static createCustom(
    props: Omit<PowerProps, 'custom' | 'createdAt'>,
    id?: UniqueEntityId,
  ): Power {
    const power = new Power(
      {
        ...props,
        custom: true,
        createdAt: new Date(),
      },
      id,
    );

    this.validate(power.props);

    return power;
  }
}
