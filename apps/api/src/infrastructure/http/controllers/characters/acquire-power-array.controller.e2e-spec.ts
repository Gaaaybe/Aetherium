import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Power Array Character Controllers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let characterId: string;
  let powerArrayId: string;
  let power1Id: string;
  let power2Id: string;

  const validCharacterBody = {
    narrative: {
      identity: 'Array Master',
      origin: 'Test Origin',
      motivations: ['Master Arrays'],
      complications: ['Dependent on Arrays'],
    },
    attributes: {
      strength: 2,
      dexterity: 2,
      constitution: 2,
      intelligence: 3,
      wisdom: 2,
      charisma: 2,
      keyPhysical: 'dexterity',
      keyMental: 'intelligence',
    },
    spiritualPrinciple: {
      isUnlocked: false,
    },
  };

  const validPowerBody = {
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
      name: 'Array User',
      email: 'arrayuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'arrayuser@example.com',
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

    const power1Response = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validPowerBody,
        nome: 'Power Array Power 1',
        descricao: 'First power for array testing',
      });

    power1Id = power1Response.body.id;

    const power2Response = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validPowerBody,
        nome: 'Power Array Power 2',
        descricao: 'Second power for array testing',
      });

    power2Id = power2Response.body.id;

    const powerArrayResponse = await request(app.getHttpServer())
      .post('/power-arrays')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nome: 'Test Power Array',
        descricao: 'A test power array for character testing',
        dominio: { name: 'arma-branca' },
        powerIds: [power1Id, power2Id],
        isPublic: true,
      });

    powerArrayId = powerArrayResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /characters/:characterId/power-arrays — should acquire power array and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/power-arrays`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerArrayId });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: characterId,
      narrative: expect.any(Object),
      attributes: expect.any(Object),
    });

    powerArrayId = response.body.powerArrays[0].powerArrayId;
  });

  test('[POST] /characters/:characterId/power-arrays — should return 401 without token', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/power-arrays`)
      .send({ powerArrayId });

    expect(response.statusCode).toBe(401);
  });

  test('[POST] /characters/:characterId/power-arrays — should return 400 with invalid powerArrayId', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/power-arrays`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerArrayId: 'not-a-uuid' });

    expect(response.statusCode).toBe(400);
  });

  test('[PATCH] /characters/:characterId/power-arrays/:powerArrayId/equip — should equip power array and return 200', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/power-arrays/${powerArrayId}/equip`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerArrayId });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: characterId,
      narrative: expect.any(Object),
      attributes: expect.any(Object),
    });
  });

  test('[PATCH] /characters/:characterId/power-arrays/:powerArrayId/equip — should return 401 without token', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/power-arrays/${powerArrayId}/equip`)
      .send({ powerArrayId });

    expect(response.statusCode).toBe(401);
  });

  test('[PATCH] /characters/:characterId/power-arrays/:powerArrayId/unequip — should unequip power array and return 200', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/power-arrays/${powerArrayId}/unequip`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: characterId,
      narrative: expect.any(Object),
      attributes: expect.any(Object),
    });
  });

  test('[PATCH] /characters/:characterId/power-arrays/:powerArrayId/unequip — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).patch(
      `/characters/${characterId}/power-arrays/${powerArrayId}/unequip`,
    );

    expect(response.statusCode).toBe(401);
  });

  test('[PATCH] /characters/:characterId/power-arrays/:powerArrayId/unequip — should return 404 for non-existent power array', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/power-arrays/00000000-0000-0000-0000-000000000000/unequip`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });
});
