import { Module } from '@nestjs/common';
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository';
import { EffectsRepository } from '@/domain/power-manager/application/repositories/effects-repository';
import { ModificationsRepository } from '@/domain/power-manager/application/repositories/modifications-repository';
import { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';
import { PowerArraysRepository } from '@/domain/power-manager/application/repositories/power-arrays-repository';
import { PowersRepository } from '@/domain/power-manager/application/repositories/powers-repository';
import { PrismaService } from './prisma/prisma.service';
import { PrismaEffectsRepository } from './prisma/repositories/prisma-effects-repository';
import { PrismaModificationsRepository } from './prisma/repositories/prisma-modifications-repository';
import { PrismaPeculiaritiesRepository } from './prisma/repositories/prisma-peculiarities-repository';
import { PrismaPowerArraysRepository } from './prisma/repositories/prisma-power-arrays-repository';
import { PrismaPowersRepository } from './prisma/repositories/prisma-powers-repository';
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository';

@Module({
  providers: [
    PrismaService,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
    { provide: PowersRepository, useClass: PrismaPowersRepository },
    { provide: PowerArraysRepository, useClass: PrismaPowerArraysRepository },
    { provide: PeculiaritiesRepository, useClass: PrismaPeculiaritiesRepository },
    { provide: ModificationsRepository, useClass: PrismaModificationsRepository },
    { provide: EffectsRepository, useClass: PrismaEffectsRepository },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    PowersRepository,
    PowerArraysRepository,
    PeculiaritiesRepository,
    ModificationsRepository,
    EffectsRepository,
  ],
})
export class DatabaseModule {}
