import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('CustomResourcesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let characterId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const email = `custom-resources-${Date.now()}@example.com`;
    await request(app.getHttpServer()).post('/users').send({
      name: 'Custom Resources User', email, password: '123456',
    });
    const auth = await request(app.getHttpServer()).post('/auth').send({ email, password: '123456' });
    expect(auth.statusCode, JSON.stringify(auth.body)).toBe(200);
    accessToken = auth.body.access_token;
    const character = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'Contador',
          origin: 'Teste',
          motivations: ['Testar recursos'],
          complications: ['Recurso instável'],
        },
        attributes: {
          strength: 10, dexterity: 10, constitution: 10,
          intelligence: 10, wisdom: 10, charisma: 10,
          keyPhysical: 'strength', keyMental: 'wisdom',
        },
        spiritualPrinciple: { isUnlocked: false },
      });
    expect(character.statusCode, JSON.stringify(character.body)).toBe(201);
    characterId = character.body.id;
  });

  afterAll(async () => {
    if (characterId) {
      await request(app.getHttpServer())
        .delete(`/characters/${characterId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    }
    await app.close();
  });

  const createResource = (name: string) => request(app.getHttpServer())
    .post(`/characters/${characterId}/resources`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name, description: 'Descrição', style: 'COUNTER', color: 'indigo', current: 0, minimum: 0, maximum: 10, step: 1 });

  test('cria, ajusta concorrentemente, valida ordem e exclui recursos', async () => {
    const first = await createResource('Carga');
    expect(first.statusCode).toBe(201);
    const firstId = first.body.customResources[0].id;

    const second = await createResource('Fúria');
    expect(second.statusCode).toBe(201);
    const secondId = second.body.customResources[1].id;

    const adjustments = await Promise.all([
      request(app.getHttpServer()).patch(`/characters/${characterId}/resources/${firstId}/value`).set('Authorization', `Bearer ${accessToken}`).send({ delta: 1 }),
      request(app.getHttpServer()).patch(`/characters/${characterId}/resources/${firstId}/value`).set('Authorization', `Bearer ${accessToken}`).send({ delta: 1 }),
    ]);
    expect(adjustments.every(response => response.statusCode === 200)).toBe(true);
    const refreshed = await request(app.getHttpServer())
      .get(`/characters/${characterId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const current = refreshed.body.customResources.find((resource: any) => resource.id === firstId).current;
    expect(current).toBe(2);

    const invalidOrder = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/resources/order`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ resourceIds: [firstId, firstId] });
    expect(invalidOrder.statusCode).toBe(400);

    const validOrder = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/resources/order`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ resourceIds: [secondId, firstId] });
    expect(validOrder.statusCode).toBe(200);
    expect(validOrder.body.customResources.map((resource: any) => resource.id)).toEqual([secondId, firstId]);

    const removed = await request(app.getHttpServer())
      .delete(`/characters/${characterId}/resources/${secondId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(removed.statusCode).toBe(200);
    expect(removed.body.customResources).toHaveLength(1);
    expect(removed.body.customResources[0].position).toBe(0);
  });
});
