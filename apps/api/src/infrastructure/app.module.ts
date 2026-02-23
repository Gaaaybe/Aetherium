import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PowerCreationModule } from './power-creation.module';

@Module({
  imports: [PowerCreationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
