import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { AcquireBenefitController } from '@/infrastructure/http/controllers/characters/acquire-benefit.controller';
import { AcquireDomainMasteryController } from '@/infrastructure/http/controllers/characters/acquire-domain-mastery.controller';
import { AcquirePowerController } from '@/infrastructure/http/controllers/characters/acquire-power.controller';
import { AcquirePowerArrayController } from '@/infrastructure/http/controllers/characters/acquire-power-array.controller';
import { AddItemToInventoryController } from '@/infrastructure/http/controllers/characters/add-item-to-inventory.controller';
import { AddRunicsController } from '@/infrastructure/http/controllers/characters/add-runics.controller';
import { ChangeInventoryItemQuantityController } from '@/infrastructure/http/controllers/characters/change-inventory-item-quantity.controller';
// Controllers
import { CreateCharacterController } from '@/infrastructure/http/controllers/characters/create-character.controller';
import { DeleteCharacterController } from '@/infrastructure/http/controllers/characters/delete-character.controller';
import { ChangeCharacterOwnerController } from '@/infrastructure/http/controllers/characters/change-character-owner.controller';
import { DeletePowerArrayFromCharacterController } from '@/infrastructure/http/controllers/characters/delete-power-array-from-character.controller';
import { DeletePowerFromCharacterController } from '@/infrastructure/http/controllers/characters/delete-power-from-character.controller';
import { DiscardBenefitController } from '@/infrastructure/http/controllers/characters/discard-benefit.controller';
import { DiscardDomainMasteryController } from '@/infrastructure/http/controllers/characters/discard-domain-mastery.controller';
import { EquipItemController } from '@/infrastructure/http/controllers/characters/equip-item.controller';
import { EquipPowerController } from '@/infrastructure/http/controllers/characters/equip-power.controller';
import { EquipPowerArrayController } from '@/infrastructure/http/controllers/characters/equip-power-array.controller';
import { EvolveSpiritualPrincipleController } from '@/infrastructure/http/controllers/characters/evolve-spiritual-principle.controller';
import { FetchAllCharactersController } from '@/infrastructure/http/controllers/characters/fetch-all-characters.controller';
import { FetchUserCharactersController } from '@/infrastructure/http/controllers/characters/fetch-user-characters.controller';
import { GetCharacterByIdController } from '@/infrastructure/http/controllers/characters/get-character-by-id.controller';
import { LevelUpCharacterController } from '@/infrastructure/http/controllers/characters/level-up-character.controller';
import { RemoveFromInventoryController } from '@/infrastructure/http/controllers/characters/remove-from-inventory.controller';
import { RestCharacterController } from '@/infrastructure/http/controllers/characters/rest-character.controller';
import { SpendRunicsController } from '@/infrastructure/http/controllers/characters/spend-runics.controller';
import { SyncCharacterController } from '@/infrastructure/http/controllers/characters/sync-character.controller';
import { TickDeathCounterController } from '@/infrastructure/http/controllers/characters/tick-death-counter.controller';
import { UnequipItemController } from '@/infrastructure/http/controllers/characters/unequip-item.controller';
import { UnequipPowerController } from '@/infrastructure/http/controllers/characters/unequip-power.controller';
import { UnequipPowerArrayController } from '@/infrastructure/http/controllers/characters/unequip-power-array.controller';
import { UnlockSpiritualPrincipleController } from '@/infrastructure/http/controllers/characters/unlock-spiritual-principle.controller';
import { UpdateUnarmedMasteryController } from '@/infrastructure/http/controllers/characters/update-unarmed-mastery.controller';
import { UpgradeItemController } from '@/infrastructure/http/controllers/characters/upgrade-item.controller';
import { ItemManagerModule } from '@/modules/item-manager/item-manager.module';
import { PowerManagerModule } from '@/modules/power-manager/power-manager.module';
import { CharactersService } from './characters.service';

@Module({
  imports: [DatabaseModule, PowerManagerModule, ItemManagerModule],
  controllers: [
    CreateCharacterController,
    FetchUserCharactersController,
    GetCharacterByIdController,
    FetchAllCharactersController,
    DeleteCharacterController,
    ChangeCharacterOwnerController,
    UpdateUnarmedMasteryController,
    AcquireDomainMasteryController,
    DiscardDomainMasteryController,
    UnlockSpiritualPrincipleController,
    EvolveSpiritualPrincipleController,
    LevelUpCharacterController,
    RestCharacterController,
    TickDeathCounterController,
    SyncCharacterController,
    AddItemToInventoryController,
    RemoveFromInventoryController,
    ChangeInventoryItemQuantityController,
    AddRunicsController,
    SpendRunicsController,
    EquipItemController,
    UnequipItemController,
    UpgradeItemController,
    AcquirePowerController,
    EquipPowerController,
    UnequipPowerController,
    DeletePowerFromCharacterController,
    AcquirePowerArrayController,
    EquipPowerArrayController,
    UnequipPowerArrayController,
    DeletePowerArrayFromCharacterController,
    AcquireBenefitController,
    DiscardBenefitController,
  ],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharacterManagerModule {}
