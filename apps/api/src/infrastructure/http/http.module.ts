import { Module } from '@nestjs/common';
import { RegisterUserUseCase } from '@/domain/accounts/application/useCases/register-user';
import { CryptographyModule } from '../cryptography/cryptography.module';
import { DatabaseModule } from '../database/database.module';
import { RegisterUserController } from './controllers/register-user.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [RegisterUserController],
  providers: [RegisterUserUseCase],
})
export class HttpModule {}
