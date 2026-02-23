import { Module } from '@nestjs/common';
import { CatalogController } from './http/controllers/catalog.controller';
import { CatalogService } from './services/catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class PowerCreationModule {}
