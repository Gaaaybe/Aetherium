import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('EquipPowerController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let characterId: string;
  let powerId: string;

  const validCharacterBody = {
    narrative: {
      identity: 'Power Equipper',
      origin: 'Test Origin',
      motivations: ['Master Combat'],
      complications: ['Overconfident'],
    },
    attributes: {
      strength: 3,
      dexterity: 2,
      constitution: 2,
      intelligence: 2,
      wisdom: 2,
      charisma: 2,
      keyPhysical: 'strength',
      keyMental: 'wisdom',
    },
    spiritualPrinciple: {
      isUnlocked: false,
    },
  };

  const validPowerBody = {
    nome: 'Combat Power',
    descricao: 'A combat power for equipping',
    dominio: { name: 'arma-branca' },
    parametros: { acao: 0, alcance: 0, duracao: 0 },
    effects: [
      {
        effectBaseId: 'dano',
        grau: 1,
        modifications: [],
      },
    ],
    globalModifications: [],
    isPublic: true,
  };

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
      name: 'Equip User',
      email: 'equipuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'equipuser@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const characterResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validCharacterBody);

    characterId = characterResponse.body.id;

    await request(app.getHttpServer())
      .post(`/characters/${characterId}/domains`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ domainId: 'arma-branca', masteryLevel: 'INICIANTE' });

    const powerResponse = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validPowerBody);

    powerId = powerResponse.body.id;

    const acquireResponse = await request(app.getHttpServer())
      .post(`/characters/${characterId}/powers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId });

    powerId = acquireResponse.body.powers[0].powerId;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/equip — should equip power and return 200', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/${powerId}/equip`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: characterId,
      narrative: expect.any(Object),
      attributes: expect.any(Object),
    });
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/equip — should return 401 without token', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/${powerId}/equip`)
      .send({ powerId });

    expect(response.statusCode).toBe(401);
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/equip — should return 404 for non-existent character', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/00000000-0000-0000-0000-000000000000/powers/${powerId}/equip`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId });

    expect(response.statusCode).toBe(404);
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/equip — should return 404 for non-existent power', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/00000000-0000-0000-0000-000000000000/equip`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId: '00000000-0000-0000-0000-000000000000' });

    expect(response.statusCode).toBe(404);
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/equip — should return 403 for unauthorized user', async () => {
    await request(app.getHttpServer()).post('/users').send({
      name: 'Unauthorized User',
      email: 'unauthorized@example.com',
      password: '123456',
    });

    const unauthorizedAuthResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'unauthorized@example.com',
      password: '123456',
    });

    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/${powerId}/equip`)
      .set('Authorization', `Bearer ${unauthorizedAuthResponse.body.access_token}`)
      .send({ powerId });

    expect(response.statusCode).toBe(403);
  });
});
