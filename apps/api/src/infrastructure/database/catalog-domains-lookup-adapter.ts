import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class CatalogDomainsLookupAdapter {
  private readonly dataPath = join(process.cwd(), 'data');

  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    // 1. Check in static dominios.json
    const filePath = join(this.dataPath, 'dominios.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const domains = JSON.parse(fileContent) as Array<{ id: string }>;

    const normalizedId = id.trim().toLowerCase();
    const found = domains.find((domain) => domain.id.trim().toLowerCase() === normalizedId);

    if (found) {
      return found;
    }

    // 2. Check in DB via Prisma
    try {
      const peculiarity = await this.prisma.peculiarity.findUnique({
        where: { id },
      });
      if (peculiarity) {
        return {
          id: peculiarity.id,
          nome: peculiarity.nome,
          categoria: 'especial',
          espiritual: peculiarity.espiritual,
          icone: peculiarity.icone,
        };
      }
    } catch (e) {
      // In case of invalid UUID or other error
    }

    return null;
  }
}
