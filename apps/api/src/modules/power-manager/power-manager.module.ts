import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { PowersService } from './powers.service';

// Peculiarity controllers
import { CreatePeculiarityController } from '@/infrastructure/http/controllers/peculiarities/create-peculiarity.controller';
import { UpdatePeculiarityController } from '@/infrastructure/http/controllers/peculiarities/update-peculiarity.controller';
import { DeletePeculiarityController } from '@/infrastructure/http/controllers/peculiarities/delete-peculiarity.controller';
import { FetchPublicPeculiaritiesController } from '@/infrastructure/http/controllers/peculiarities/fetch-public-peculiarities.controller';
import { FetchUserPeculiaritiesController } from '@/infrastructure/http/controllers/peculiarities/fetch-user-peculiarities.controller';
import { GetPeculiarityByIdController } from '@/infrastructure/http/controllers/peculiarities/get-peculiarity-by-id.controller';
import { CopyPublicPeculiarityController } from '@/infrastructure/http/controllers/peculiarities/copy-public-peculiarity.controller';

// Power controllers
import { CreatePowerController } from '@/infrastructure/http/controllers/powers/create-power.controller';
import { UpdatePowerController } from '@/infrastructure/http/controllers/powers/update-power.controller';
import { DeletePowerController } from '@/infrastructure/http/controllers/powers/delete-power.controller';
import { FetchPublicPowersController } from '@/infrastructure/http/controllers/powers/fetch-public-powers.controller';
import { FetchUserPowersController } from '@/infrastructure/http/controllers/powers/fetch-user-powers.controller';
import { GetPowerByIdController } from '@/infrastructure/http/controllers/powers/get-power-by-id.controller';
import { CopyPublicPowerController } from '@/infrastructure/http/controllers/powers/copy-public-power.controller';
import { FetchCharacterPowersController } from '@/infrastructure/http/controllers/characters/fetch-character-powers.controller';

// PowerArray controllers
import { CreatePowerArrayController } from '@/infrastructure/http/controllers/power-arrays/create-power-array.controller';
import { UpdatePowerArrayController } from '@/infrastructure/http/controllers/power-arrays/update-power-array.controller';
import { DeletePowerArrayController } from '@/infrastructure/http/controllers/power-arrays/delete-power-array.controller';
import { FetchPublicPowerArraysController } from '@/infrastructure/http/controllers/power-arrays/fetch-public-power-arrays.controller';
import { FetchUserPowerArraysController } from '@/infrastructure/http/controllers/power-arrays/fetch-user-power-arrays.controller';
import { GetPowerArrayByIdController } from '@/infrastructure/http/controllers/power-arrays/get-power-array-by-id.controller';
import { CopyPublicPowerArrayController } from '@/infrastructure/http/controllers/power-arrays/copy-public-power-array.controller';
import { FetchCharacterPowerArraysController } from '@/infrastructure/http/controllers/characters/fetch-character-power-arrays.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    // Peculiarities
    CreatePeculiarityController,
    UpdatePeculiarityController,
    DeletePeculiarityController,
    FetchPublicPeculiaritiesController,
    FetchUserPeculiaritiesController,
    GetPeculiarityByIdController,
    CopyPublicPeculiarityController,
    // Powers
    CreatePowerController,
    UpdatePowerController,
    DeletePowerController,
    FetchPublicPowersController,
    FetchUserPowersController,
    GetPowerByIdController,
    CopyPublicPowerController,
    FetchCharacterPowersController,
    // PowerArrays
    CreatePowerArrayController,
    UpdatePowerArrayController,
    DeletePowerArrayController,
    FetchPublicPowerArraysController,
    FetchUserPowerArraysController,
    GetPowerArrayByIdController,
    CopyPublicPowerArrayController,
    FetchCharacterPowerArraysController,
  ],
  providers: [PowersService],
  exports: [PowersService],
})
export class PowerManagerModule {}
