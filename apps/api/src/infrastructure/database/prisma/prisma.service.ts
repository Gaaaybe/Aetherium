import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common/interfaces/hooks';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL!
    const schema = new URL(connectionString).searchParams.get('schema') ?? 'public'
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool, { schema });
    super({
      adapter,
      log: ['warn', 'error'],
    });
  }
  onModuleInit() {
    return this.$connect();
  }
  onModuleDestroy() {
    return this.$disconnect();
  }
}
