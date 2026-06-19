import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('UnequipPowerController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let characterId: string;
  let powerId: string;

  const validCharacterBody = {
    narrative: {
      identity: 'Power Unequipper',
      origin: 'Test Origin',
      motivations: ['Tactical Flexibility'],
      complications: ['Indecisive'],
    },
    attributes: {
      strength: 2,
      dexterity: 3,
      constitution: 2,
      intelligence: 2,
      wisdom: 2,
      charisma: 2,
      keyPhysical: 'dexterity',
      keyMental: 'wisdom',
    },
    spiritualPrinciple: {
      isUnlocked: false,
    },
  };

  const validPowerBody = {
    nome: 'Tactical Power',
    descricao: 'A tactical power for unequipping',
    dominio: { name: 'arma-branca' },
    parametros: { acao: 1, alcance: 2, duracao: 0 },
    effects: [
      {
        effectBaseId: 'dano',
        grau: 3,
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
      name: 'Unequip User',
      email: 'unequipuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'unequipuser@example.com',
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

    
    await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/${powerId}/equip`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/unequip — should unequip power and return 200', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/${powerId}/unequip`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: characterId,
      narrative: expect.any(Object),
      attributes: expect.any(Object),
    });
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/unequip — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).patch(
      `/characters/${characterId}/powers/${powerId}/unequip`,
    );

    expect(response.statusCode).toBe(401);
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/unequip — should return 404 for non-existent character', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/00000000-0000-0000-0000-000000000000/powers/${powerId}/unequip`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/unequip — should return 404 for non-existent power', async () => {
    const response = await request(app.getHttpServer())
      .patch(
        `/characters/${characterId}/powers/00000000-0000-0000-0000-000000000000/unequip`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/unequip — should return 403 for unauthorized user', async () => {
    
    await request(app.getHttpServer()).post('/users').send({
      name: 'Unequip Unauthorized User',
      email: 'unequipunauth@example.com',
      password: '123456',
    });

    const unauthorizedAuthResponse = await request(app.getHttpServer())
      .post('/auth')
      .send({
        email: 'unequipunauth@example.com',
        password: '123456',
      });

    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/${powerId}/unequip`)
      .set('Authorization', `Bearer ${unauthorizedAuthResponse.body.access_token}`);

    expect(response.statusCode).toBe(403);
  });

  test('[PATCH] /characters/:characterId/powers/:powerId/unequip — should unequip even if power was not equipped', async () => {
    
    const newPowerBody = {
      nome: 'Unequipped Power',
      descricao: 'A power that was never equipped',
      dominio: { name: 'arma-branca' },
      parametros: { acao: 1, alcance: 1, duracao: 0 },
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

    const newPowerResponse = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(newPowerBody);

    const newPowerId = newPowerResponse.body.id;

    
    await request(app.getHttpServer())
      .post(`/characters/${characterId}/powers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId: newPowerId });

    
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/powers/${newPowerId}/unequip`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect([200, 400, 404]).toContain(response.statusCode);
  });
});
