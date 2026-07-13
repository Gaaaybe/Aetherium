import { Prisma, PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LUCIDE_ICON = (name: string) => `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/${name}.svg`;

async function main() {
  console.log('🚀 Reiniciando Seed de Desenvolvimento Corrigido...\n')

  // 1. USUÁRIO
  const passwordHash = await hash('aetherium123', 6)
  const user = await prisma.user.upsert({
    where: { email: 'dev@aetherium.com' },
    update: {},
    create: {
      email: 'dev@aetherium.com',
      name: 'Dev Explorer',
      password: passwordHash,
      roles: ['PLAYER', 'ADMIN']
    }
  })
  console.log('👤 Usuário Dev criado (dev@aetherium.com / aetherium123)')

  // Limpar dados anteriores para evitar duplicidade ou lixo
  await prisma.item.deleteMany({ where: { userId: user.id } });
  await prisma.powerArray.deleteMany({ where: { userId: user.id } });
  await prisma.power.deleteMany({ where: { userId: user.id } });
  await prisma.peculiarity.deleteMany({ where: { userId: user.id } });

  // 2. PECULIARIDADES
  const pecDraconica = await prisma.peculiarity.create({
    data: {
      id: 'pec-draconica',
      userId: user.id,
      nome: 'Herança Dracônica',
      descricao: 'Sangue elemental corre em suas veias, concedendo afinidade com fogo e resistência física.',
      espiritual: true,
      icone: LUCIDE_ICON('flame')
    }
  })

  const pecNeural = await prisma.peculiarity.create({
    data: {
      id: 'pec-neural',
      userId: user.id,
      nome: 'Interface Neural',
      descricao: 'Implantes cibernéticos permitem processamento de dados em tempo real e controle tecnológico.',
      espiritual: false,
      icone: LUCIDE_ICON('cpu')
    }
  })
  console.log('🧪 Peculiaridades criadas')

  // 3. PODERES
  // Sopro de Fogo Infernal (Área Cone, Dano + Efeito Secundário)
  const poderSopro = await prisma.power.create({
    data: {
      id: 'pow-sopro-fogo',
      userId: user.id,
      nome: 'Sopro de Fogo Infernal',
      descricao: 'Lança um cone de chamas místicas que continuam queimando os alvos.',
      domainName: 'NATURAL',
      icone: LUCIDE_ICON('flame'),
      parametrosAcao: 1,
      parametrosAlcance: 1,
      parametrosDuracao: 0,
      custoTotalPda: 12,
      custoTotalPe: 6,
      custoTotalEspacos: 0,
      appliedEffects: {
        create: [
          {
            effectBaseId: 'dano',
            grau: 5,
            posicao: 0,
            custoPda: 12,
            custoPe: 6,
            custoEspacos: 0,
            appliedModifications: {
              create: [
                { modificationBaseId: 'area', scope: 'LOCAL', grau: 2, posicao: 0, parametros: { format: 'cone' } },
                { modificationBaseId: 'efeito-secundario', scope: 'LOCAL', grau: 1, posicao: 1 }
              ]
            }
          }
        ]
      }
    }
  })

  // Escudo Psíquico (Gatilho)
  const poderEscudo = await prisma.power.create({
    data: {
      id: 'pow-escudo-psiquico',
      userId: user.id,
      nome: 'Escudo Psíquico',
      descricao: 'Uma barreira mental que se manifesta automaticamente ao sofrer um ataque.',
      domainName: 'PSIQUICO',
      icone: LUCIDE_ICON('shield-alert'),
      parametrosAcao: 3,
      parametrosAlcance: 0,
      parametrosDuracao: 1,
      custoTotalPda: 8,
      custoTotalEspacos: 0,
      appliedEffects: {
        create: [
          {
            effectBaseId: 'fortalecer',
            grau: 3,
            configuracaoId: 'rd',
            posicao: 0,
            custoPda: 8,
            custoPe: 0,
            custoEspacos: 0,
            appliedModifications: {
              create: [
                { modificationBaseId: 'engatilhado', scope: 'LOCAL', grau: 1, posicao: 0, parametros: { trigger: 'Ao ser atacado' } }
              ]
            }
          }
        ]
      }
    }
  })
  console.log('⚔️ Poderes base criados')

  // 4. ACERVOS
  const acervoCacador = await prisma.powerArray.create({
    data: {
      id: 'arr-cacador',
      userId: user.id,
      nome: 'Arsenal do Caçador Stelar',
      descricao: 'Conjunto de técnicas e equipamentos para caçar abominações interdimensionais.',
      domainName: 'NATURAL', // Alinhado com o poder pow-sopro-fogo
      icone: LUCIDE_ICON('crosshair'),
      custoTotalPda: 20,
      custoTotalPe: 10,
      custoTotalEspacos: 1,
      powerArrayPowers: {
        create: [
          { powerId: 'pow-sopro-fogo', posicao: 0 }
        ]
      }
    }
  })
  console.log('🎒 Acervo criado')

  // 5. ITENS
  // Lâmina Rúnica (Armas precisam de critMargin, critMultiplier e alcance obrigatórios no mapper)
  await prisma.item.create({
    data: {
      id: 'item-lamina-runica',
      userId: user.id,
      tipo: 'WEAPON',
      nome: 'Lâmina Rúnica do Alvorecer',
      descricao: 'Uma espada antiga gravada com runas que brilham com luz solar.',
      domains: ['PSIQUICO'],
      domainPeculiarIds: [],
      custoBase: 500,
      nivelItem: 1,
      icone: LUCIDE_ICON('sword'),
      critMargin: 19,
      critMultiplier: 3,
      alcance: 'ADJACENTE',
      upgradeLevelValue: 0,
      upgradeLevelMax: 7,
      itemDamages: {
        create: [
          { dado: '1d8', base: 'FOR', posicao: 0 },
          { dado: '1d6', base: '0', espiritual: true, posicao: 1 }
        ]
      },
      itemPowers: {
        create: [
          { powerId: 'pow-escudo-psiquico', posicao: 0 }
        ]
      }
    }
  })

  // Peitoral de Adamantino (Defesa precisa de tipoEquipamento obrigatório no mapper)
  await prisma.item.create({
    data: {
      id: 'item-peitoral-adamante',
      userId: user.id,
      tipo: 'DEFENSIVE_EQUIPMENT',
      nome: 'Peitoral de Adamantino',
      descricao: 'Armadura pesada forjada de minério estelar, virtualmente impenetrável.',
      domains: ['ARMA_TECNOLOGICA'],
      domainPeculiarIds: [],
      custoBase: 2500,
      nivelItem: 3,
      icone: LUCIDE_ICON('shield'),
      tipoEquipamento: 'PROTECAO',
      baseRD: 10,
      upgradeLevelValue: 0,
      upgradeLevelMax: 9
    }
  })

  // Poção de Vigor (Consumível precisa de isRefeicao obrigatório)
  await prisma.item.create({
    data: {
      id: 'item-pocao-vigor',
      userId: user.id,
      tipo: 'CONSUMABLE',
      nome: 'Poção de Vigor Místico',
      descricao: 'Um elixir que pulsa com energia vital.',
      domains: ['NATURAL'],
      domainPeculiarIds: [],
      custoBase: 150,
      icone: LUCIDE_ICON('beaker'),
      descritorEfeito: 'Recupera 10 PE e cura condições leves.',
      qtdDoses: 1,
      isRefeicao: false,
      spoilageState: 'PERFEITA'
    }
  })

  // Núcleo Estelar (Material precisa de materialTier e materialMaxUpgradeLimit)
  await prisma.item.create({
    data: {
      id: 'item-nucleo-estelar',
      userId: user.id,
      tipo: 'UPGRADE_MATERIAL',
      nome: 'Núcleo de Energia Estelar',
      descricao: 'Material raríssimo usado para aprimorar equipamentos ao Patamar 3.',
      domains: ['CIENTIFICO'],
      domainPeculiarIds: [],
      domainAreaConhecimento: 'Engenharia de Materiais', // Obrigatório para CIENTIFICO
      custoBase: 5000,
      icone: LUCIDE_ICON('codepen'),
      materialTier: 3,
      materialMaxUpgradeLimit: 10
    }
  })

  // Amuleto (Artefato)
  await prisma.item.create({
    data: {
      id: 'item-amuleto-aether',
      userId: user.id,
      tipo: 'ARTIFACT',
      nome: 'Olho de Aether',
      descricao: 'Um artefato relíquia que permite vislumbrar outras dimensões.',
      domains: ['SAGRADO'],
      domainPeculiarIds: [],
      custoBase: 10000,
      icone: LUCIDE_ICON('eye'),
      isAttuned: true
    }
  })
  console.log('🏺 Itens de todos os tipos criados')

  console.log('\n✅ Seed de Desenvolvimento Concluído com Sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
