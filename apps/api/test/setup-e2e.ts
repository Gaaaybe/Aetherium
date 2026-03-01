import { config } from 'dotenv'
import { afterAll, beforeAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { execSync } from 'node:child_process'
import { DomainEvents } from '@/core/events/domain-events'
import { envSchema } from '@/infrastructure/env/env'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

const env = envSchema.parse(process.env)

function generateUniqueDatabaseURL(schemaId: string) {
  if (!env.DATABASE_URL) {
    throw new Error('Please provider a DATABASE_URL environment variable')
  }

  const url = new URL(env.DATABASE_URL)
  url.searchParams.set('schema', schemaId)
  return url.toString()
}

const schemaId = randomUUID()

const databaseURL = generateUniqueDatabaseURL(schemaId)

const schema = new URL(databaseURL).searchParams.get('schema') ?? 'public'
const pool = new Pool({ connectionString: databaseURL })
const adapter = new PrismaPg(pool, { schema })
const prisma = new PrismaClient({ adapter })

beforeAll(async () => {
  process.env.DATABASE_URL = databaseURL

  DomainEvents.clearHandlers()
  DomainEvents.clearMarkedAggregates()

  execSync('pnpm prisma migrate deploy')
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})
