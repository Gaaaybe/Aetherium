import { Module } from '@nestjs/common';
import { CatalogBenefitsLookupAdapter } from './catalog-benefits-lookup-adapter';
import { CatalogDomainsLookupAdapter } from './catalog-domains-lookup-adapter';
import { PrismaService } from './prisma/prisma.service';
import { PrismaCharacterManagerItemsLookupAdapter } from './prisma-character-manager-items-lookup-adapter';
import { PrismaCharacterManagerPowerArraysLookupAdapter } from './prisma-character-manager-power-arrays-lookup-adapter';
import { PrismaCharacterManagerPowersLookupAdapter } from './prisma-character-manager-powers-lookup-adapter';

@Module({
  providers: [
    PrismaService,
    PrismaCharacterManagerPowersLookupAdapter,
    PrismaCharacterManagerPowerArraysLookupAdapter,
    PrismaCharacterManagerItemsLookupAdapter,
    CatalogBenefitsLookupAdapter,
    CatalogDomainsLookupAdapter,
  ],
  exports: [
    PrismaService,
    PrismaCharacterManagerPowersLookupAdapter,
    PrismaCharacterManagerPowerArraysLookupAdapter,
    PrismaCharacterManagerItemsLookupAdapter,
    CatalogBenefitsLookupAdapter,
    CatalogDomainsLookupAdapter,
  ],
})
export class DatabaseModule {}
