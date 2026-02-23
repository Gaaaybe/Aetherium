import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';

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
