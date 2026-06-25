import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('AcquirePowerController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let characterId: string;
  let powerId: string;

  const validCharacterBody = {
    narrative: {
      identity: 'Power Acquirer',
      origin: 'Test Origin',
      motivations: ['Learn Magic'],
      complications: ['Inexperienced'],
    },
    attributes: {
      strength: 1,
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
    nome: 'Test Power',
    descricao: 'A test power for acquiring',
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
      name: 'Power User',
      email: 'poweruser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'poweruser@example.com',
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
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /characters/:characterId/powers — should acquire power and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/powers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: characterId,
      narrative: expect.any(Object),
      attributes: expect.any(Object),
    });
  });

  test('[POST] /characters/:characterId/powers — should return 401 without token', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/powers`)
      .send({ powerId });

    expect(response.statusCode).toBe(401);
  });

  test('[POST] /characters/:characterId/powers — should return 400 with invalid powerId', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/powers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId: 'not-a-uuid' });

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /characters/:characterId/powers — should return 404 when power does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/powers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        powerId: '00000000-0000-0000-0000-000000000000',
      });

    expect(response.statusCode).toBe(404);
  });

  test('[POST] /characters/:characterId/powers — should return 404 when character does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters/00000000-0000-0000-0000-000000000000/powers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ powerId });

    expect(response.statusCode).toBe(404);
  });
});
