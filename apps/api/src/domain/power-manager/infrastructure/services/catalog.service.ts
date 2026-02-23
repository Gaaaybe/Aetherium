import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class CatalogService {
  private readonly dataPath = join(__dirname, '../data');

  getScales() {
    const filePath = join(this.dataPath, 'escalas.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  getUniversalTable() {
    const filePath = join(this.dataPath, 'tabelaUniversal.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  getDomains() {
    const filePath = join(this.dataPath, 'dominios.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }
}
