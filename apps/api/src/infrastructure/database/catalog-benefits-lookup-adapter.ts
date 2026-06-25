import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';

export interface BenefitInfo {
  nome: string;
  tipo?: string;
  graus?: number | string;
  descricao?: string;
  regra_custo?: string;
  custo_base?: number;
}

@Injectable()
export class CatalogBenefitsLookupAdapter {
  private readonly dataPath = join(process.cwd(), 'data');

  async findByName(name: string): Promise<BenefitInfo | null> {
    const filePath = join(this.dataPath, 'beneficios.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const benefits = JSON.parse(fileContent) as BenefitInfo[];

    const normalizedName = name.trim().toLowerCase();
    const found = benefits.find((benefit) => benefit.nome.trim().toLowerCase() === normalizedName);

    return found ?? null;
  }
}
