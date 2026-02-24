import { OwnableEntity } from '@/core/entities/ownable-entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import { DomainValidationError } from '@/core/errors/domain-validation-error';
import type { Optional } from '@/core/types/optional';

interface PeculiarityProps {
  userId: string;
  nome: string;
  descricao: string;
  espiritual: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Peculiarity extends OwnableEntity<PeculiarityProps> {
  get userId(): string {
    return this.props.userId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get espiritual(): boolean {
    return this.props.espiritual;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  update(partial: { nome?: string; descricao?: string; espiritual?: boolean }): Peculiarity {
    return Peculiarity.create(
      {
        userId: this.props.userId,
        nome: partial.nome ?? this.props.nome,
        descricao: partial.descricao ?? this.props.descricao,
        espiritual: partial.espiritual ?? this.props.espiritual,
        isPublic: this.props.isPublic,
        createdAt: this.props.createdAt,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  makePublic(): Peculiarity {
    return new Peculiarity(
      {
        ...this.props,
        isPublic: true,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  makePrivate(): Peculiarity {
    return new Peculiarity(
      {
        ...this.props,
        isPublic: false,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  private static validate(props: PeculiarityProps): void {
    if (!props.userId || props.userId.trim() === '') {
      throw new DomainValidationError('ID do usuário é obrigatório', 'userId');
    }

    if (!props.nome || props.nome.trim() === '') {
      throw new DomainValidationError('Nome da peculiaridade é obrigatório', 'nome');
    }

    if (props.nome.length < 3) {
      throw new DomainValidationError(
        'Nome da peculiaridade deve ter no mínimo 3 caracteres',
        'nome',
      );
    }

    if (props.nome.length > 100) {
      throw new DomainValidationError(
        'Nome da peculiaridade deve ter no máximo 100 caracteres',
        'nome',
      );
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new DomainValidationError('Descrição da peculiaridade é obrigatória', 'descricao');
    }

    if (props.descricao.length < 10) {
      throw new DomainValidationError(
        'Descrição da peculiaridade deve ter no mínimo 10 caracteres',
        'descricao',
      );
    }

    if (props.descricao.length > 500) {
      throw new DomainValidationError(
        'Descrição da peculiaridade deve ter no máximo 500 caracteres',
        'descricao',
      );
    }

    if (typeof props.espiritual !== 'boolean') {
      throw new DomainValidationError('Campo espiritual deve ser boolean', 'espiritual');
    }
  }

  static create(
    props: Optional<PeculiarityProps, 'isPublic' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ): Peculiarity {
    const peculiarity = new Peculiarity(
      {
        ...props,
        isPublic: props.isPublic ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    Peculiarity.validate(peculiarity.props);

    return peculiarity;
  }
}
