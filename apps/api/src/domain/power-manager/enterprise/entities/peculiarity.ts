import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { Optional } from '@/core/types/optional';

interface PeculiarityProps {
  userId: string;
  nome: string;
  descricao: string;
  espiritual: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class Peculiarity extends AggregateRoot<PeculiarityProps> {
  get userId(): string {
    return this.props.userId;
  }

  get nome(): string {
    return this.props.nome;
  }

  set nome(value: string) {
    this.props.nome = value;
    this.touch();
  }

  get descricao(): string {
    return this.props.descricao;
  }

  set descricao(value: string) {
    this.props.descricao = value;
    this.touch();
  }

  get espiritual(): boolean {
    return this.props.espiritual;
  }

  set espiritual(value: boolean) {
    this.props.espiritual = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  private static validate(props: PeculiarityProps): void {
    if (!props.userId || props.userId.trim() === '') {
      throw new Error('ID do usuário é obrigatório');
    }

    if (!props.nome || props.nome.trim() === '') {
      throw new Error('Nome da peculiaridade é obrigatório');
    }

    if (props.nome.length < 3) {
      throw new Error('Nome da peculiaridade deve ter no mínimo 3 caracteres');
    }

    if (props.nome.length > 100) {
      throw new Error('Nome da peculiaridade deve ter no máximo 100 caracteres');
    }

    if (!props.descricao || props.descricao.trim() === '') {
      throw new Error('Descrição da peculiaridade é obrigatória');
    }

    if (props.descricao.length < 10) {
      throw new Error('Descrição da peculiaridade deve ter no mínimo 10 caracteres');
    }

    if (props.descricao.length > 500) {
      throw new Error('Descrição da peculiaridade deve ter no máximo 500 caracteres');
    }

    if (typeof props.espiritual !== 'boolean') {
      throw new Error('Campo espiritual deve ser boolean');
    }
  }

  static create(
    props: Optional<PeculiarityProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ): Peculiarity {
    const peculiarity = new Peculiarity(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    Peculiarity.validate(peculiarity.props);

    return peculiarity;
  }
}
