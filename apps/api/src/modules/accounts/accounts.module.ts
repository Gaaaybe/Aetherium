import { Module } from '@nestjs/common';
import { CryptographyModule } from '@/infrastructure/cryptography/cryptography.module';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import {
  AuthenticateController,
  RegisterUserController,
} from '@/infrastructure/http/controllers/accounts/accounts.controller';
import { FetchAllUsersController } from '@/infrastructure/http/controllers/accounts/fetch-all-users.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [RegisterUserController, AuthenticateController, FetchAllUsersController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
