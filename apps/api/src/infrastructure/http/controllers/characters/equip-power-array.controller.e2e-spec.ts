import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Equip Power Array (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let characterId: string;
  let arrayId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

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
      },
      update: {},
    });

    await request(app.getHttpServer()).post('/users').send({
      name: 'Equip Array User',
      email: 'equiparray@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'equiparray@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const createCharResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'Array Tester',
          origin: 'Lab',
          motivations: ['Testing'],
          complications: ['Bugs'],
        },
        attributes: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          keyPhysical: 'strength',
          keyMental: 'wisdom',
        },
        spiritualPrinciple: { isUnlocked: false },
      });

    characterId = createCharResponse.body.id;

    await request(app.getHttpServer())
      .post(`/characters/${characterId}/domains`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ domainId: 'arma-branca', masteryLevel: 'INICIANTE' });

    await request(app.getHttpServer())
      .post(`/characters/${characterId}/level-up`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    await request(app.getHttpServer())
      .post(`/characters/${characterId}/level-up`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    const powerResponse = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nome: 'Test Power',
        descricao: 'A power for testing',
        dominio: { name: 'arma-branca' },
        parametros: { acao: 1, alcance: 1, duracao: 0 },
        effects: [{ effectBaseId: 'dano', grau: 1 }],
        isPublic: true,
      });

    const powerId = powerResponse.body.id;

    const arrayResponse = await request(app.getHttpServer())
      .post('/power-arrays')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nome: 'Test Array',
        descricao: 'An array for testing',
        dominio: { name: 'arma-branca' },
        powerIds: [powerId],
        isPublic: true,
      });

    const templateId = arrayResponse.body.id;

    const acquireResponse = await request(app.getHttpServer())
      .post(`/characters/${characterId}/power-arrays`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerArrayId: templateId });

    if (!acquireResponse.body.powerArrays) {
      throw new Error(`Acquisition failed: ${JSON.stringify(acquireResponse.body)}`);
    }

    arrayId = acquireResponse.body.powerArrays[0].powerArrayId;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[PATCH] /characters/:id/power-arrays/:arrayId/equip', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/power-arrays/${arrayId}/equip`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.powerArrays[0].isEquipped).toBe(true);
  });
});
