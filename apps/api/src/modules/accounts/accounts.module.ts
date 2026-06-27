import { Module } from '@nestjs/common';
import { CryptographyModule } from '@/infrastructure/cryptography/cryptography.module';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import {
  AuthenticateController,
  RegisterUserController,
} from '@/infrastructure/http/controllers/accounts/accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [RegisterUserController, AuthenticateController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
