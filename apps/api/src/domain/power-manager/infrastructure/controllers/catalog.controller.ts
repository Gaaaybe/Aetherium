import { Controller, Get } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('scales')
  getScales() {
    return this.catalogService.getScales();
  }

  @Get('universal-table')
  getUniversalTable() {
    return this.catalogService.getUniversalTable();
  }

  @Get('domains')
  getDomains() {
    return this.catalogService.getDomains();
  }
}
