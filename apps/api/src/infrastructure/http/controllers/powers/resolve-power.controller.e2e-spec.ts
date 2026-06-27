import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { PowerResolutionService } from '@/modules/power-manager/power-resolution.service';

describe('ResolvePowerController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let powerResolutionService: PowerResolutionService;
  let accessToken: string;
  let powerId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    powerResolutionService = moduleRef.get(PowerResolutionService);

    await app.init();

    // 1. Cadastra o efeito de dano com behavior mecânico no banco
    await prisma.effectBase.upsert({
      where: { id: 'dano' },
      create: {
        id: 'dano',
        nome: 'Dano',
        custoBase: 2,
        descricao: 'Causa dano a um alvo.',
        categorias: ['Ataque'],
        parametrosPadraoAcao: 1,
        parametrosPadraoAlcance: 1,
        parametrosPadraoDuracao: 0,
        requerInput: false,
        behavior: {
          kind: 'DANO',
          tipoDano: 'impacto',
        },
      },
      update: {
        behavior: {
          kind: 'DANO',
          tipoDano: 'impacto',
        },
      },
    });

    // 2. Cadastra modificação de área
    await prisma.modificationBase.upsert({
      where: { id: 'area' },
      create: {
        id: 'area',
        nome: 'Área',
        tipo: 'EXTRA',
        custoFixo: 0,
        custoPorGrau: 1,
        descricao: 'Atinge múltiplos alvos.',
        categoria: 'targeting',
        targetingEffect: 'AREA',
      },
      update: {
        targetingEffect: 'AREA',
      },
    });

    // 3. Cadastra os efeitos filhos para reatividade (Fase 2 - Agonia)
    await prisma.effectBase.upsert({
      where: { id: 'recuperacao-pv-1d4' },
      create: {
        id: 'recuperacao-pv-1d4',
        nome: 'Recuperação PV 1d4',
        custoBase: 1,
        descricao: 'Cura 1d4 PV.',
        categorias: ['Suporte'],
        parametrosPadraoAcao: 1,
        parametrosPadraoAlcance: 1,
        parametrosPadraoDuracao: 0,
        requerInput: false,
        behavior: {
          kind: 'RECUPERACAO',
          recurso: 'PV',
          formula: '1d4',
        },
      },
      update: {},
    });

    await prisma.effectBase.upsert({
      where: { id: 'recuperacao-pe-4' },
      create: {
        id: 'recuperacao-pe-4',
        nome: 'Recuperação PE 4',
        custoBase: 1,
        descricao: 'Restaura 4 PE.',
        categorias: ['Suporte'],
        parametrosPadraoAcao: 1,
        parametrosPadraoAlcance: 1,
        parametrosPadraoDuracao: 0,
        requerInput: false,
        behavior: {
          kind: 'RECUPERACAO',
          recurso: 'PE',
          formula: '4',
        },
      },
      update: {},
    });

    // 4. Cadastra usuário e faz login
    await request(app.getHttpServer()).post('/users').send({
      name: 'Resolve User',
      email: 'resolveuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'resolveuser@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    // 5. Cria o poder
    const powerResponse = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nome: 'Bola de Fogo Mecânica',
        descricao: 'Uma bola de fogo perfeitamente simulada.',
        dominio: { name: 'natural' },
        parametros: { acao: 1, alcance: 2, duracao: 0 },
        effects: [
          {
            effectBaseId: 'dano',
            grau: 5,
            modifications: [
              {
                modificationBaseId: 'area',
                grau: 2,
              },
            ],
          },
        ],
        globalModifications: [],
        isPublic: false,
      });

    powerId = powerResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /powers/:id/resolve — should resolve and return list of mutations', async () => {
    const response = await request(app.getHttpServer())
      .post(`/powers/${powerId}/resolve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sceneId: 'scene-test-1',
        candidateTargetIds: ['target-dummy-1', 'target-dummy-2'],
        casterState: {
          id: 'caster-dummy-1',
          keyPhysicalModifier: 2,
          keyMentalModifier: 1,
          level: 4,
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      resolutionMode: 'ON_USE',
      mutations: [
        {
          type: 'DEAL_DAMAGE',
          targetId: 'target-dummy-1',
          formula: '1d128', // Grau 5 da tabela universal
          damageType: 'impacto',
        },
        {
          type: 'DEAL_DAMAGE',
          targetId: 'target-dummy-2',
          formula: '1d128',
          damageType: 'impacto',
        },
      ],
    });
  });

  test('[POST] /powers/:id/resolve — should return 401 without auth token', async () => {
    const response = await request(app.getHttpServer())
      .post(`/powers/${powerId}/resolve`)
      .send({
        sceneId: 'scene-test-1',
        candidateTargetIds: ['target-dummy-1'],
        casterState: {
          id: 'caster-dummy-1',
          keyPhysicalModifier: 2,
          keyMentalModifier: 1,
          level: 4,
        },
      });

    expect(response.statusCode).toBe(401);
  });

  test('Fase 2 — CombatEventListener & Agonia Reatividade Flow', async () => {
    const user = await prisma.user.findFirst({ where: { email: 'resolveuser@example.com' } });
    if (!user) throw new Error('User not found');

    // 1. Cria atacante e defensor no banco de dados com valores conhecidos
    const attacker = await prisma.character.create({
      data: {
        userId: user.id,
        level: 5,
        attributes: { constitution: { baseValue: 12 }, strength: { baseValue: 10 }, intelligence: { baseValue: 10 } },
        narrativeProfile: {},
        skills: { Fortitude: { proficiencyState: 'UNTRAINED' }, Reflexos: { proficiencyState: 'UNTRAINED' } },
        pdaState: { extraPda: 0, spentPda: 0 },
        healthState: { currentPV: 10, temporaryPV: 0 },
        energyState: { currentPE: 5, temporaryPE: 0 },
        spiritualPrinciple: {},
        equipmentSlots: {},
        inventory: {},
        conditions: [],
      },
    });

    const defender = await prisma.character.create({
      data: {
        userId: user.id,
        level: 5,
        attributes: { constitution: { baseValue: 12 }, strength: { baseValue: 10 }, intelligence: { baseValue: 10 } },
        narrativeProfile: {},
        skills: { Fortitude: { proficiencyState: 'UNTRAINED' }, Reflexos: { proficiencyState: 'UNTRAINED' } },
        pdaState: { extraPda: 0, spentPda: 0 },
        healthState: { currentPV: 50, temporaryPV: 0 },
        energyState: { currentPE: 10, temporaryPE: 0 },
        spiritualPrinciple: {},
        equipmentSlots: {},
        inventory: {},
        conditions: [],
      },
    });

    const sceneId = 'scene-reactivity-test';

    // 2. Aplica marcador Laço de Ódio no defensor
    await powerResolutionService.applyMutations(sceneId, attacker.id, [
      {
        type: 'APPLY_MARKER',
        targetId: defender.id,
        markerId: 'laco-de-odio',
        label: 'Laço de Ódio',
        duracao: 'CENA',
        sourcePowerId: 'laco-power',
      },
    ]);

    // 3. Registra gatilho da Agonia no atacante
    await powerResolutionService.applyMutations(sceneId, attacker.id, [
      {
        type: 'REGISTER_TRIGGER',
        targetId: null,
        trigger: {
          evento: 'DANO_CORPO_A_CORPO_CAUSADO',
          condicao: 'alvo.tem_marcador:laco-de-odio',
          efeitosFilhos: ['recuperacao-pv-1d4', 'recuperacao-pe-4'],
        },
        sourcePowerId: 'agonia-power',
      },
    ]);

    // 4. Aplica dano no defensor (isso deve emitir o evento e reativar a cura do atacante!)
    await powerResolutionService.applyMutations(sceneId, attacker.id, [
      {
        type: 'DEAL_DAMAGE',
        targetId: defender.id,
        formula: '10', // Causa 10 de dano
        damageType: 'impacto',
      },
    ]);

    // 5. Verifica se o defensor tomou dano
    const updatedDefender = await prisma.character.findUnique({ where: { id: defender.id } });
    // Dano base de 10
    expect(updatedDefender?.healthState).toMatchObject({
      currentPV: 40,
    });

    // 6. Verifica se o atacante recuperou 4 PE e curou de 1d4 PV (PV final deve ser > 10 e PE final deve ser 9)
    const updatedAttacker = await prisma.character.findUnique({ where: { id: attacker.id } });
    const healthState = updatedAttacker?.healthState as { currentPV: number };
    const energyState = updatedAttacker?.energyState as { currentPE: number };

    expect(healthState.currentPV).toBeGreaterThan(10);
    expect(energyState.currentPE).toBe(9); // 5 base + 4 recuperados

    // Limpa
    await prisma.sceneEffectInstance.deleteMany({ where: { sceneId } });
    await prisma.character.deleteMany({ where: { id: { in: [attacker.id, defender.id] } } });
  });
});
