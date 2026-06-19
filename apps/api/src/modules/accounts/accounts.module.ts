import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { CryptographyModule } from '@/infrastructure/cryptography/cryptography.module';
import { AccountsService } from './accounts.service';
import { RegisterUserController, AuthenticateController } from './accounts.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [RegisterUserController, AuthenticateController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
