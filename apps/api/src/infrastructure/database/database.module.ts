import { Module } from '@nestjs/common';
import { UsersRepository } from '@/domain/accounts/application/repositories/users-repository';
import { BenefitsLookupPort as CharacterBenefitsLookupPort } from '@/domain/character-manager/application/repositories/benefits-lookup-port';
import { CharactersRepository } from '@/domain/character-manager/application/repositories/characters-repository';
import { DomainsLookupPort as CharacterDomainsLookupPort } from '@/domain/character-manager/application/repositories/domains-lookup-port';
import { ItemsLookupPort as CharacterItemsLookupPort } from '@/domain/character-manager/application/repositories/items-lookup-port';
import { PowerArraysLookupPort as CharacterPowerArraysLookupPort } from '@/domain/character-manager/application/repositories/power-arrays-lookup-port';
import { PowersLookupPort as CharacterPowersLookupPort } from '@/domain/character-manager/application/repositories/powers-lookup-port';
import { ItemsRepository } from '@/domain/item-manager/application/repositories/items-repository';
import { EffectsRepository } from '@/domain/power-manager/application/repositories/effects-repository';
import { ModificationsRepository } from '@/domain/power-manager/application/repositories/modifications-repository';
import { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';
import { PowerDependenciesRepository } from '@/domain/power-manager/application/repositories/power-dependencies-repository';
import { PowerArraysRepository } from '@/domain/power-manager/application/repositories/power-arrays-repository';
import { PowersRepository } from '@/domain/power-manager/application/repositories/powers-repository';
import { CatalogBenefitsLookupAdapter } from './catalog-benefits-lookup-adapter';
import { CatalogDomainsLookupAdapter } from './catalog-domains-lookup-adapter';
import { PrismaCharacterManagerItemsLookupAdapter } from './prisma-character-manager-items-lookup-adapter';
import { PrismaCharacterManagerPowerArraysLookupAdapter } from './prisma-character-manager-power-arrays-lookup-adapter';
import { PrismaCharacterManagerPowersLookupAdapter } from './prisma-character-manager-powers-lookup-adapter';
import { PrismaService } from './prisma/prisma.service';
import { PrismaCharactersRepository } from './prisma/repositories/prisma-characters-repository';
import { PrismaEffectsRepository } from './prisma/repositories/prisma-effects-repository';
import { PrismaItemsRepository } from './prisma/repositories/prisma-items-repository';
import { PrismaModificationsRepository } from './prisma/repositories/prisma-modifications-repository';
import { PrismaPeculiaritiesRepository } from './prisma/repositories/prisma-peculiarities-repository';
import { PrismaPowerDependenciesRepository } from './prisma/repositories/prisma-power-dependencies-repository';
import { PrismaPowerArraysRepository } from './prisma/repositories/prisma-power-arrays-repository';
import { PrismaPowersRepository } from './prisma/repositories/prisma-powers-repository';
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository';

@Module({
  providers: [
    PrismaService,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
    { provide: CharactersRepository, useClass: PrismaCharactersRepository },
    { provide: CharacterPowersLookupPort, useClass: PrismaCharacterManagerPowersLookupAdapter },
    {
      provide: CharacterPowerArraysLookupPort,
      useClass: PrismaCharacterManagerPowerArraysLookupAdapter,
    },
    { provide: CharacterItemsLookupPort, useClass: PrismaCharacterManagerItemsLookupAdapter },
    { provide: CharacterBenefitsLookupPort, useClass: CatalogBenefitsLookupAdapter },
    { provide: CharacterDomainsLookupPort, useClass: CatalogDomainsLookupAdapter },
    { provide: PowersRepository, useClass: PrismaPowersRepository },
    { provide: PowerArraysRepository, useClass: PrismaPowerArraysRepository },
    { provide: PowerDependenciesRepository, useClass: PrismaPowerDependenciesRepository },
    { provide: PeculiaritiesRepository, useClass: PrismaPeculiaritiesRepository },
    { provide: ModificationsRepository, useClass: PrismaModificationsRepository },
    { provide: EffectsRepository, useClass: PrismaEffectsRepository },
    { provide: ItemsRepository, useClass: PrismaItemsRepository },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    CharactersRepository,
    CharacterPowersLookupPort,
    CharacterPowerArraysLookupPort,
    CharacterItemsLookupPort,
    CharacterBenefitsLookupPort,
    CharacterDomainsLookupPort,
    PowersRepository,
    PowerArraysRepository,
    PowerDependenciesRepository,
    PeculiaritiesRepository,
    ModificationsRepository,
    EffectsRepository,
    ItemsRepository,
  ],
})
export class DatabaseModule {}
