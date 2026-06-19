import { Module } from '@nestjs/common';
import { OnCharacterItemDiscarded } from '@/domain/item-manager/application/subscribers/on-character-item-discarded';
import { OnCharacterPowerArrayDiscarded } from '@/domain/power-manager/application/subscribers/on-character-power-array-discarded';
import { OnCharacterPowerDiscarded } from '@/domain/power-manager/application/subscribers/on-character-power-discarded';
import { OnPowerArrayMadePublic } from '@/domain/power-manager/application/subscribers/on-power-array-made-public';
import { OnPowerMadePublic } from '@/domain/power-manager/application/subscribers/on-power-made-public';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { DatabaseModule } from '../database/database.module';
import { CatalogService } from '../services/catalog.service';
import { CatalogController } from './controllers/catalog/catalog.controller';
import { FetchEffectsController } from './controllers/catalog/fetch-effects.controller';
import { FetchModificationsController } from './controllers/catalog/fetch-modifications.controller';
import { CharacterManagerModule } from '@/modules/character-manager/character-manager.module';
import { PowerManagerModule } from '@/modules/power-manager/power-manager.module';

@Module({
  imports: [DatabaseModule, CryptographyModule, PowerManagerModule, CharacterManagerModule],
  controllers: [
    CatalogController,
    FetchEffectsController,
    FetchModificationsController,
  ],
  providers: [
    CatalogService,
    // Domain event subscribers
    OnPowerMadePublic,
    OnPowerArrayMadePublic,
    OnCharacterItemDiscarded,
    OnCharacterPowerDiscarded,
    OnCharacterPowerArrayDiscarded,
  ],
})
export class HttpModule {}
