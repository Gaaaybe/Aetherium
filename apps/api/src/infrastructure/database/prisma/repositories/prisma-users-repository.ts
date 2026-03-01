import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository';
import type { User } from '@/domain/accounts/enterprise/entities/user';
import { toDomain, toPrisma } from '../mappers/prisma-user-mapper';
import type { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUsersRepository extends UsersRepository {
  constructor(private prisma: PrismaService) {
    super();
  }
  async create(user: User): Promise<User> {
    const userRaw = toPrisma(user);

    const createdUser = await this.prisma.user.create({
      data: userRaw,
    });

    return toDomain(createdUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return null;
    }

    return toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return null;
    }

    return toDomain(user);
  }
}
