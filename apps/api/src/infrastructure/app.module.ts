import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AccountsModule } from '@/modules/accounts/accounts.module';
import { ItemManagerModule } from '@/modules/item-manager/item-manager.module';
import { PowerManagerModule } from '@/modules/power-manager/power-manager.module';
import { AuthModule } from './auth/auth.module';
import { EnvModule } from './env/env.module';
import { HttpModule } from './http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    AuthModule,
    HttpModule,
    EnvModule,
    ItemManagerModule,
    PowerManagerModule,
    AccountsModule,
  ],
})
export class AppModule {}
