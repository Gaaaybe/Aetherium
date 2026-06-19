import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EnvModule } from './env/env.module';
import { HttpModule } from './http/http.module';
import { ItemManagerModule } from '@/modules/item-manager/item-manager.module';
import { PowerManagerModule } from '@/modules/power-manager/power-manager.module';
import { AccountsModule } from '@/modules/accounts/accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    HttpModule,
    EnvModule,
    ItemManagerModule,
    PowerManagerModule,
    AccountsModule,
  ],
})
export class AppModule {}

