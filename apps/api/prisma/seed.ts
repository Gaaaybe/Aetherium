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

  for (const e of efeitos) {
    const data = {
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
    }

    await prisma.effectBase.upsert({
      where: { id: e.id },
      update: data,
      create: { id: e.id, ...data },
    })
  }

  console.log(`✓ ${efeitos.length} efeitos processados`)
}

async function seedModificationBases() {
  const modificacoes = modificacoesData as ModificacaoJson[]

  console.log(`Inserindo ${modificacoes.length} modificações base...`)

  for (const m of modificacoes) {
    const data = {
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
    }

    await prisma.modificationBase.upsert({
      where: { id: m.id },
      update: data,
      create: { id: m.id, ...data },
    })
  }

  console.log(`✓ ${modificacoes.length} modificações processadas`)
}

// ============================================
// AUTOMAÇÃO — behaviors e targeting
// ============================================

/**
 * Mapeia o campo `behavior` nos EffectBase que têm mecânica estruturada.
 * Efeitos sem behavior (narrativos ou não mapeados) permanecem com behavior=null.
 *
 * Adiciona conforme novos efeitos forem formalizados.
 */
async function seedEffectBehaviors() {
  console.log('Mapeando behaviors de efeitos...')

  const behaviors: Array<{ id: string; behavior: object }> = [
    {
      id: 'dano',
      behavior: {
        kind: 'DANO',
        // formula: null → motor usa tabela universal pelo grau
        tipoDano: 'impacto', // tipo padrão — poderes específicos sobrescrevem via inputValue
      },
    },
    {
      id: 'recuperacao',
      behavior: {
        kind: 'RECUPERACAO',
        recurso: 'PV',
        formula: 'tabela', // motor resolve pela tabela universal (grau)
      },
    },
  ]

  for (const { id, behavior } of behaviors) {
    await prisma.effectBase.update({
      where: { id },
      data: { behavior: behavior as Prisma.InputJsonValue },
    })
  }

  console.log(`✓ ${behaviors.length} behaviors de efeito mapeados`)
}

/**
 * Mapeia os campos de automação (targetingEffect, casterEffect, markerCondition)
 * nas ModificationBase relevantes.
 *
 * A maioria das modificações permanece com os defaults ('NENHUM').
 */
async function seedModificationAutomation() {
  console.log('Mapeando automação de modificações...')

  const automations: Array<{
    id: string
    targetingEffect?: string
    casterEffect?: string
    markerCondition?: string
  }> = [
    // Modificações de targeting
    { id: 'area',     targetingEffect: 'AREA' },
    { id: 'seletivo', targetingEffect: 'SELETIVO' },
    // Limitado é aplicado por poder específico (ex: Laço de Ódio) via markerCondition
    // Efeito colateral — duas variantes do catálogo
    { id: 'efeito-colateral', casterEffect: 'EFEITO_COLATERAL_SEMPRE' }, // sobrescrito por configuração ao falhar
  ]

  for (const { id, targetingEffect, casterEffect, markerCondition } of automations) {
    await prisma.modificationBase.update({
      where: { id },
      data: {
        ...(targetingEffect  !== undefined && { targetingEffect }),
        ...(casterEffect     !== undefined && { casterEffect }),
        ...(markerCondition  !== undefined && { markerCondition }),
      },
    })
  }

  console.log(`✓ ${automations.length} modificações com automação mapeadas`)
}

async function main() {
  console.log('Iniciando seed...\n')

  await seedEffectBases()
  await seedModificationBases()
  await seedEffectBehaviors()
  await seedModificationAutomation()

  console.log('\nSeed concluído!')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
