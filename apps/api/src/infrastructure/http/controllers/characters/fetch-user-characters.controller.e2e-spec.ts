import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('FetchUserCharactersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const validCharacterBody = {
    narrative: {
      identity: 'Test Character',
      origin: 'Test Origin',
      motivations: ['Test Motivation'],
      complications: ['Test Complication'],
    },
    attributes: {
      strength: 2,
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Fetch User',
      email: 'fetchuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'fetchuser@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validCharacterBody);

    await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validCharacterBody,
        narrative: {
          ...validCharacterBody.narrative,
          identity: 'Second Character',
        },
      });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /characters/me — should return 200 with array of characters', async () => {
    const response = await request(app.getHttpServer())
      .get('/characters/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  test('[GET] /characters/me — should return character objects with required fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/characters/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      narrative: expect.any(Object),
      attributes: expect.any(Object),
    });
  });

  test('[GET] /characters/me — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).get('/characters/me');

    expect(response.statusCode).toBe(401);
  });

  test('[GET] /characters/me — should return empty array when user has no characters', async () => {
    await request(app.getHttpServer()).post('/users').send({
      name: 'Empty User',
      email: 'emptyuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'emptyuser@example.com',
      password: '123456',
    });

    const response = await request(app.getHttpServer())
      .get('/characters/me')
      .set('Authorization', `Bearer ${authResponse.body.access_token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});
