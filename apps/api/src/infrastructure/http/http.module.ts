import { Module } from '@nestjs/common';
import { CharacterManagerModule } from '@/modules/character-manager/character-manager.module';
import { OnCharacterItemDiscarded } from '@/modules/item-manager/subscribers/on-character-item-discarded';
import { PowerManagerModule } from '@/modules/power-manager/power-manager.module';
import { OnCharacterPowerArrayDiscarded } from '@/modules/power-manager/subscribers/on-character-power-array-discarded';
import { OnCharacterPowerDiscarded } from '@/modules/power-manager/subscribers/on-character-power-discarded';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { DatabaseModule } from '../database/database.module';
import { CatalogService } from '../services/catalog.service';
import { CatalogController } from './controllers/catalog/catalog.controller';
import { FetchEffectsController } from './controllers/catalog/fetch-effects.controller';
import { FetchModificationsController } from './controllers/catalog/fetch-modifications.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule, PowerManagerModule, CharacterManagerModule],
  controllers: [CatalogController, FetchEffectsController, FetchModificationsController],
  providers: [
    CatalogService,
    // Domain event subscribers
    OnCharacterItemDiscarded,
    OnCharacterPowerDiscarded,
    OnCharacterPowerArrayDiscarded,
  ],
})
export class HttpModule {}
