import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
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

    return user;
  }
}
