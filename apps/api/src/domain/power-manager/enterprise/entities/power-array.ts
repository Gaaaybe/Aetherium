import { OwnableEntity } from '@/core/entities/ownable-entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import { DomainValidationError } from '@/core/errors/domain-validation-error';
import type { Optional } from '@/core/types/optional';
import { PowerArrayMadePublicEvent } from '../events/power-array-made-public-event';
import type { Domain } from './value-objects/domain';
import type { PowerCost } from './value-objects/power-cost';
import type { PowerParameters } from './value-objects/power-parameters';
import type { PowerArrayPowerList } from './watched-lists/power-array-power-list';

interface PowerArrayProps {
  userId?: string;
  nome: string;
  descricao: string;
  dominio: Domain;
  parametrosBase?: PowerParameters;
  powers: PowerArrayPowerList;
  custoTotal: PowerCost;
  isPublic: boolean;
  notas?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class PowerArray extends OwnableEntity<PowerArrayProps> {
  get userId(): string | undefined {
    return this.props.userId;
  }

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

  get custoTotal(): PowerCost {
    return this.props.custoTotal;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
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

  update(partial: {
    nome?: string;
    descricao?: string;
    dominio?: Domain;
    parametrosBase?: PowerParameters;
    powers?: PowerArrayPowerList;
    custoTotal?: PowerCost;
    notas?: string;
  }): PowerArray {
    return PowerArray.create(
      {
        userId: this.props.userId,
        nome: partial.nome ?? this.props.nome,
        descricao: partial.descricao ?? this.props.descricao,
        dominio: partial.dominio ?? this.props.dominio,
        parametrosBase: partial.parametrosBase ?? this.props.parametrosBase,
        powers: partial.powers ?? this.props.powers,
        custoTotal: partial.custoTotal ?? this.props.custoTotal,
        notas: partial.notas ?? this.props.notas,
        isPublic: this.props.isPublic,
        createdAt: this.props.createdAt,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  makePublic(): PowerArray {
    if (this.isOfficial()) {
      throw new DomainValidationError(
        'Acervos oficiais não podem ser tornados públicos',
        'isPublic',
      );
    }

    const privatePowerIds = this.props.powers
      .getItems()
      .filter((power) => !power.isOfficial() && !power.isPublic)
      .map((power) => power.id.toString());

    const powerArray = new PowerArray(
      {
        ...this.props,
        isPublic: true,
        updatedAt: new Date(),
      },
      this.id,
    );

    powerArray.addDomainEvent(new PowerArrayMadePublicEvent(powerArray, privatePowerIds));

    return powerArray;
  }

  makePrivate(): PowerArray {
    if (this.isOfficial()) {
      throw new DomainValidationError(
        'Acervos oficiais não podem ser tornados privados',
        'isPublic',
      );
    }

    return new PowerArray(
      {
        ...this.props,
        isPublic: false,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  private static validate(props: PowerArrayProps): void {
    if (!props.nome || props.nome.trim() === '') {
      throw new DomainValidationError('Nome do acervo é obrigatório', 'nome');
    }

    if (props.nome.length > 100) {
      throw new DomainValidationError('Nome do acervo não pode exceder 100 caracteres', 'nome');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new DomainValidationError('Descrição do acervo é obrigatória', 'descricao');
    }

    const powerItems = props.powers.getItems();

    if (powerItems.length === 0) {
      throw new DomainValidationError('Um acervo deve ter pelo menos um poder', 'powers');
    }

    if (powerItems.length > 50) {
      throw new DomainValidationError('Um acervo não pode ter mais de 50 poderes', 'powers');
    }

    const firstDomain = powerItems[0].dominio;
    const allSameDomain = powerItems.every((power) => power.dominio.equals(firstDomain));

    if (!allSameDomain) {
      throw new DomainValidationError(
        'Todos os poderes de um acervo devem ter o mesmo domínio',
        'dominio',
      );
    }

    if (!props.dominio.equals(firstDomain)) {
      throw new DomainValidationError(
        'O domínio do acervo deve ser igual ao domínio dos poderes',
        'dominio',
      );
    }
  }

  static create(
    props: Optional<PowerArrayProps, 'isPublic' | 'createdAt' | 'notas'>,
    id?: UniqueEntityId,
  ): PowerArray {
    const arrayPower = new PowerArray(
      {
        ...props,
        isPublic: props.isPublic ?? false,
        createdAt: props.createdAt ?? new Date(),
        notas: props.notas,
      },
      id,
    );

    PowerArray.validate(arrayPower.props);

    return arrayPower;
  }

  static createOfficial(
    props: Omit<PowerArrayProps, 'userId' | 'isPublic' | 'createdAt'>,
    id?: UniqueEntityId,
  ): PowerArray {
    return PowerArray.create(
      {
        ...props,
        userId: undefined,
        isPublic: false,
      },
      id,
    );
  }
}
