import { Prisma, PrismaClient } from '@prisma/client'
import efeitosData from '../data/efeitos.json'
import modificacoesData from '../data/modificacoes.json'
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// TIPOS DOS JSONs
// ============================================

interface ConfiguracaoOpcao {
  id: string
  nome: string
  modificadorCusto?: number
  modificadorCustoFixo?: number
  grauMinimo?: number
  descricao: string
  custoProgressivo?: string
}

interface Configuracoes {
  tipo: 'select' | 'radio'
  label: string
  opcoes: ConfiguracaoOpcao[]
}

interface EfeitoJson {
  id: string
  nome: string
  custoBase: number
  descricao: string
  parametrosPadrao: {
    acao: number
    alcance: number
    duracao: number
  }
  categorias: string[]
  exemplos?: string
  requerInput?: boolean
  tipoInput?: string
  labelInput?: string
  opcoesInput?: string[]
  placeholderInput?: string
  configuracoes?: Configuracoes
  custoProgressivo?: boolean
  observacoes?: string
}

interface ModificacaoJson {
  id: string
  nome: string
  tipo: 'extra' | 'falha'
  custoFixo: number
  custoPorGrau: number
  descricao: string
  requerParametros: boolean
  tipoParametro?: string
  opcoes?: string[]
  placeholder?: string
  grauMinimo?: number
  grauMaximo?: number
  grauFixo?: number
  detalhesGrau?: string
  observacoes?: string
  categoria: string
  configuracoes?: Configuracoes
}

// ============================================
// SEED
// ============================================

async function seedEffectBases() {
  const efeitos = efeitosData as EfeitoJson[]

  console.log(`Inserindo ${efeitos.length} efeitos base...`)

  await prisma.effectBase.deleteMany({ where: { custom: false } })

  const data = efeitos.map((e) => ({
    id: e.id,
    nome: e.nome,
    custoBase: e.custoBase,
    descricao: e.descricao,
    categorias: e.categorias,
    exemplos: e.exemplos ?? null,
    parametrosPadraoAcao: e.parametrosPadrao.acao,
    parametrosPadraoAlcance: e.parametrosPadrao.alcance,
    parametrosPadraoDuracao: e.parametrosPadrao.duracao,
    requerInput: e.requerInput ?? false,
    tipoInput: e.tipoInput ?? null,
    labelInput: e.labelInput ?? null,
    opcoesInput: e.opcoesInput ?? [],
    placeholderInput: e.placeholderInput ?? null,
    configuracoes: e.configuracoes ? (e.configuracoes as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    custom: false,
  }))

  await prisma.effectBase.createMany({ data })

  console.log(`✓ ${efeitos.length} efeitos inseridos`)
}

async function seedModificationBases() {
  const modificacoes = modificacoesData as ModificacaoJson[]

  console.log(`Inserindo ${modificacoes.length} modificações base...`)

  await prisma.modificationBase.deleteMany({ where: { custom: false } })

  const data = modificacoes.map((m) => ({
    id: m.id,
    nome: m.nome,
    tipo: m.tipo.toUpperCase() as 'EXTRA' | 'FALHA',
    custoFixo: m.custoFixo,
    custoPorGrau: m.custoPorGrau,
    descricao: m.descricao,
    categoria: m.categoria,
    observacoes: m.observacoes ?? null,
    detalhesGrau: m.detalhesGrau ?? null,
    requerParametros: m.requerParametros,
    tipoParametro: m.tipoParametro ?? null,
    opcoes: m.opcoes ?? [],
    grauMinimo: m.grauMinimo ?? null,
    grauMaximo: m.grauMaximo ?? null,
    placeholder: m.placeholder ?? null,
    configuracoes: m.configuracoes ? (m.configuracoes as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    custom: false,
  }))

  await prisma.modificationBase.createMany({ data })

  console.log(`✓ ${modificacoes.length} modificações inseridas`)
}

async function main() {
  console.log('Iniciando seed...\n')

  await seedEffectBases()
  await seedModificationBases()

  console.log('\nSeed concluído!')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
