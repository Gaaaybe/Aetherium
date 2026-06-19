import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { HashGenerator } from '@/domain/accounts/application/cryptography/hash-generator';
import { HashComparer } from '@/domain/accounts/application/cryptography/hash-comparer';
import { Encrypter } from '@/domain/accounts/application/cryptography/encrypter';
import { AlreadyExistsError, WrongCredentialsError } from './errors/accounts.errors';
import type { RegisterUserBodySchema, AuthenticateBodySchema } from './dto/accounts.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private hashGenerator: HashGenerator,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async registerUser(body: RegisterUserBodySchema) {
    const { name, email, password, masterConfirm } = body;

    const passwordHash = await this.hashGenerator.hash(password);

    const roles: UserRole[] =
      masterConfirm === true ? [UserRole.PLAYER, UserRole.MASTER] : [UserRole.PLAYER];

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userWithSameEmail) {
      throw new AlreadyExistsError();
    }

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        roles,
      },
    });

    return user;
  }

  async authenticateUser(body: AuthenticateBodySchema) {
    const { email, password } = body;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new WrongCredentialsError();
    }

    const isPasswordValid = await this.hashComparer.compare(password, user.password);

    if (!isPasswordValid) {
      throw new WrongCredentialsError();
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id,
      email: user.email,
      name: user.name,
      isMaster: user.roles.includes(UserRole.MASTER),
    });

    return {
      accessToken,
    };
  }
}
