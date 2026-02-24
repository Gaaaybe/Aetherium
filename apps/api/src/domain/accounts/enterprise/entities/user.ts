import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import { DomainValidationError } from '@/core/errors/domain-validation-error';
import type { Optional } from '@/core/types/optional';
import { UserRole } from './value-objects/userRole';

interface UserProps {
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt?: Date;
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }

  get roles() {
    return this.props.roles;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  hasRole(role: UserRole): boolean {
    return this.props.roles.includes(role);
  }

  isMaster(): boolean {
    return this.hasRole(UserRole.MASTER);
  }

  isPlayer(): boolean {
    return this.hasRole(UserRole.PLAYER);
  }

  addRole(role: UserRole): void {
    if (!this.hasRole(role)) {
      this.props.roles.push(role);
      this.touch();
    }
  }

  removeRole(role: UserRole): void {
    if (role === UserRole.PLAYER) {
      return;
    }
    this.props.roles = this.props.roles.filter((r) => r !== role);
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  private static validate(props: UserProps): void {
    if (!props.name || props.name.trim() === '') {
      throw new DomainValidationError('Nome do usuário é obrigatório', 'name');
    }

    if (props.name.length < 2) {
      throw new DomainValidationError('Nome do usuário deve ter no mínimo 2 caracteres', 'name');
    }

    if (props.name.length > 100) {
      throw new DomainValidationError('Nome do usuário deve ter no máximo 100 caracteres', 'name');
    }

    if (!props.email || props.email.trim() === '') {
      throw new DomainValidationError('Email do usuário é obrigatório', 'email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.email)) {
      throw new DomainValidationError('Email do usuário deve ser um endereço válido', 'email');
    }

    if (!props.password || props.password.trim() === '') {
      throw new DomainValidationError('Senha do usuário é obrigatória', 'password');
    }

    if (props.password.length < 6) {
      throw new DomainValidationError(
        'Senha do usuário deve ter no mínimo 6 caracteres',
        'password',
      );
    }

    if (!props.roles || !props.roles.includes(UserRole.PLAYER)) {
      throw new DomainValidationError('Usuário deve ter pelo menos o papel de Player', 'roles');
    }
  }

  static create(
    props: Optional<UserProps, 'roles' | 'createdAt'> & {
      roles?: UserRole[];
      createdAt?: Date;
    },
    id?: UniqueEntityId,
  ) {
    const user = new User(
      {
        ...props,
        roles: props.roles ?? [UserRole.PLAYER],
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    User.validate(user.props);

    return user;
  }
}
