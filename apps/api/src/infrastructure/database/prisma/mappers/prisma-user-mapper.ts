import type { Prisma, User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import { User } from '@/domain/accounts/enterprise/entities/user';
import type { UserRole } from '@/domain/accounts/enterprise/entities/value-objects/userRole';

export function toDomain(raw: PrismaUser): User {
  return User.create(
    {
      name: raw.name,
      email: raw.email,
      password: raw.password,
      roles: raw.roles.map((role) => role as unknown as UserRole),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityId(raw.id),
  );
}

export function toPrisma(user: User): Prisma.UserUncheckedCreateInput {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    password: user.password,
    roles: user.roles.map((role) => role as unknown as PrismaUserRole),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
