import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { PowerManagerModule } from '../power-manager/power-manager.module';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { OnCharacterItemDiscarded } from './subscribers/on-character-item-discarded';

@Module({
  imports: [DatabaseModule, PowerManagerModule],
  controllers: [ItemsController],
  providers: [ItemsService, OnCharacterItemDiscarded],
  exports: [ItemsService],
})
export class ItemManagerModule {}
