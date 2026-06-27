import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('Rest Character (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let characterId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Rest User',
      email: 'rest@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'rest@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const createResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'Hero',
          origin: 'Village',
          motivations: ['Justice'],
          complications: ['Enemies'],
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
        spiritualPrinciple: {
          isUnlocked: false,
        },
      });

    characterId = createResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /characters/:id/rest - basic rest', async () => {
    const syncResponse = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/sync`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ pvChange: -5 });

    const pvBeforeRest = syncResponse.body.health.currentPV;

    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/rest`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ quality: 'CONFORTAVEL', durationHours: 8 });

    expect(response.statusCode).toBe(200);
    expect(response.body.health.currentPV).toBeGreaterThanOrEqual(pvBeforeRest);
    expect(response.body.health.currentPV).toBeLessThanOrEqual(response.body.health.maxPV);
    expect(response.body.restChange).toBeDefined();
    expect(response.body.restChange.pvChange).toBeGreaterThanOrEqual(0);
  });

  test('[POST] /characters/:id/rest - gastronomic rule (not eaten)', async () => {
    // 1. Dano no personagem
    await request(app.getHttpServer())
      .patch(`/characters/${characterId}/sync`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ pvChange: -10, peChange: -5 });

    // 2. Descanso sem comer usando a regra gastronômica
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/rest`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ quality: 'CONFORTAVEL', durationHours: 8, useGastronomicRule: true, consumedMeal: false });

    expect(response.statusCode).toBe(200);
    // Deve ficar com a condição Faminto
    expect(response.body.conditions).toContain('Faminto');
    // PV e PE não devem ter recuperado (rolagem retornada deve ser 0)
    expect(response.body.restChange.pvChange).toBe(0);
    expect(response.body.restChange.peChange).toBe(0);
  });

  test('[POST] /characters/:id/rest - gastronomic rule (eating to clear Faminto)', async () => {
    // 1. Descanso comendo usando a regra gastronômica
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/rest`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ quality: 'CONFORTAVEL', durationHours: 8, useGastronomicRule: true, consumedMeal: true });

    expect(response.statusCode).toBe(200);
    // Deve ter removido a condição Faminto
    expect(response.body.conditions).not.toContain('Faminto');
    // Como comeu, deve ter recuperado PV/PE (maior que 0)
    expect(response.body.restChange.pvChange).toBeGreaterThan(0);
  });
});
