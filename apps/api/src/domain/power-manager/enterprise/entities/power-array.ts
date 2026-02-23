import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { Optional } from '@/core/types/optional';
import { Domain } from './value-objects/domain';
import { PowerParameters } from './value-objects/power-parameters';
import { PowerCost } from './value-objects/power-cost';
import { Power } from './power';
import { PowerArrayPowerList } from './watched-lists/power-array-power-list';

export enum PowerArrayType {
  ALTERNADO = 'ALTERNADO',
  DINAMICO = 'DINAMICO',
  NORMAL = 'NORMAL',
}

interface PowerArrayProps {
  nome: string;
  descricao: string;
  dominio: Domain;
  parametrosBase?: PowerParameters;
  powers: PowerArrayPowerList;
  tipo: PowerArrayType;
  custoTotal: PowerCost;
  notas?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class PowerArray extends AggregateRoot<PowerArrayProps> {
  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get dominio(): Domain {
    return this.props.dominio;
  }

  get parametrosBase(): PowerParameters | undefined {
    return this.props.parametrosBase;
  }

  get powers(): PowerArrayPowerList {
    return this.props.powers;
  }

  get tipo(): PowerArrayType {
    return this.props.tipo;
  }

  get custoTotal(): PowerCost {
    return this.props.custoTotal;
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

  isAlternado(): boolean {
    return this.props.tipo === PowerArrayType.ALTERNADO;
  }

  isDinamico(): boolean {
    return this.props.tipo === PowerArrayType.DINAMICO;
  }

  getPowerCount(): number {
    return this.props.powers.getItems().length;
  }

  getPower(powerId: UniqueEntityId): Power | undefined {
    return this.props.powers.getItems().find((power) => power.id.equals(powerId));
  }

  addPower(power: Power): PowerArray {
    if (!power.dominio.equals(this.props.dominio)) {
      throw new Error('Poder deve ter o mesmo domínio do acervo');
    }

    const powers = new PowerArrayPowerList(this.props.powers.getItems());
    powers.add(power);

    return new PowerArray(
      {
        ...this.props,
        powers,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  removePower(powerId: UniqueEntityId): PowerArray {
    const power = this.props.powers.getItems().find((p) => p.id.equals(powerId));
    
    if (!power) {
      throw new Error('Poder não encontrado no acervo');
    }

    const powers = new PowerArrayPowerList(this.props.powers.getItems());
    powers.remove(power);

    if (powers.getItems().length === 0) {
      throw new Error('Um acervo deve ter pelo menos um poder');
    }

    return new PowerArray(
      {
        ...this.props,
        powers,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updatePower(powerId: UniqueEntityId, updatedPower: Power): PowerArray {
    if (!updatedPower.dominio.equals(this.props.dominio)) {
      throw new Error('Poder deve ter o mesmo domínio do acervo');
    }

    const currentItems = this.props.powers.getItems();
    const newItems = currentItems.map((power) =>
      power.id.equals(powerId) ? updatedPower : power,
    );

    const powers = new PowerArrayPowerList();
    powers.update(newItems);

    return new PowerArray(
      {
        ...this.props,
        powers,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateNome(nome: string): PowerArray {
    if (!nome || nome.trim() === '') {
      throw new Error('Nome do acervo não pode ser vazio');
    }

    return new PowerArray(
      {
        ...this.props,
        nome: nome.trim(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateDescricao(descricao: string): PowerArray {
    return new PowerArray(
      {
        ...this.props,
        descricao: descricao.trim(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateDominio(dominio: Domain): PowerArray {
    const invalidPowers = this.props.powers
      .getItems()
      .filter((power) => !power.dominio.equals(dominio));

    if (invalidPowers.length > 0) {
      throw new Error(
        'Não é possível mudar o domínio do acervo pois existem poderes com domínio diferente',
      );
    }

    return new PowerArray(
      {
        ...this.props,
        dominio,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateParametrosBase(parametrosBase?: PowerParameters): PowerArray {
    return new PowerArray(
      {
        ...this.props,
        parametrosBase,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateTipo(tipo: PowerArrayType): PowerArray {
    return new PowerArray(
      {
        ...this.props,
        tipo,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateCustoTotal(custoTotal: PowerCost): PowerArray {
    return new PowerArray(
      {
        ...this.props,
        custoTotal,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  updateNotas(notas?: string): PowerArray {
    return new PowerArray(
      {
        ...this.props,
        notas,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  private static validate(props: PowerArrayProps): void {
    if (!props.nome || props.nome.trim() === '') {
      throw new Error('Nome do acervo é obrigatório');
    }

    if (props.nome.length > 100) {
      throw new Error('Nome do acervo não pode exceder 100 caracteres');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new Error('Descrição do acervo é obrigatória');
    }

    const powerItems = props.powers.getItems();

    if (powerItems.length === 0) {
      throw new Error('Um acervo deve ter pelo menos um poder');
    }

    if (powerItems.length > 50) {
      throw new Error('Um acervo não pode ter mais de 50 poderes');
    }

    const firstDomain = powerItems[0].dominio;
    const allSameDomain = powerItems.every((power) => power.dominio.equals(firstDomain));

    if (!allSameDomain) {
      throw new Error('Todos os poderes de um acervo devem ter o mesmo domínio');
    }

    if (!props.dominio.equals(firstDomain)) {
      throw new Error('O domínio do acervo deve ser igual ao domínio dos poderes');
    }
  }

  static create(
    props: Optional<PowerArrayProps, 'tipo' | 'createdAt' | 'notas'>,
    id?: UniqueEntityId,
  ): PowerArray {
    const arrayPower = new PowerArray(
      {
        ...props,
        tipo: props.tipo ?? PowerArrayType.NORMAL,
        createdAt: props.createdAt ?? new Date(),
        notas: props.notas,
      },
      id,
    );

    this.validate(arrayPower.props);

    return arrayPower;
  }
}
