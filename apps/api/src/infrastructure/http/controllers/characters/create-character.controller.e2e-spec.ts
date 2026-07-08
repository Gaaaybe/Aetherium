import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('CreateCharacterController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const validBody = {
    narrative: {
      identity: 'The Warrior',
      origin: 'From the Mountains',
      motivations: ['Protect the weak'],
      complications: ['Hunted by enemies'],
    },
    attributes: {
      strength: 3,
      dexterity: 2,
      constitution: 3,
      intelligence: 1,
      wisdom: 2,
      charisma: 1,
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
      name: 'Character User',
      email: 'charuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'charuser@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /characters — should create and return 201 with character', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      narrative: {
        identity: 'The Warrior',
        origin: 'From the Mountains',
        motivations: ['Protect the weak'],
        complications: ['Hunted by enemies'],
      },
      attributes: {
        strength: {
          baseValue: 3,
        },
        dexterity: {
          baseValue: 2,
        },
        constitution: {
          baseValue: 3,
        },
        intelligence: {
          baseValue: 1,
        },
        wisdom: {
          baseValue: 2,
        },
        charisma: {
          baseValue: 1,
        },
        keyPhysical: 'strength',
        keyMental: 'wisdom',
      },
    });
  });

  test('[POST] /characters — should create and return 201 with character when name is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        narrative: {
          ...validBody.narrative,
          name: 'Arthur Pendragon',
          identity: 'The True King',
        }
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.narrative).toMatchObject({
      name: 'Arthur Pendragon',
      identity: 'The True King',
      origin: 'From the Mountains',
    });
  });

  test('[POST] /characters — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).post('/characters').send(validBody);

    expect(response.statusCode).toBe(401);
  });

  test('[POST] /characters — should return 400 when narrative is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        narrative: {
          identity: '',
          origin: 'From the Mountains',
          motivations: [],
          complications: [],
        },
      });

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /characters — should return 400 when motivations + complications < 2', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        narrative: {
          identity: 'Test',
          origin: 'Test',
          motivations: [],
          complications: [],
        },
      });

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /characters — should return 400 when attributes are invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        attributes: {
          strength: -1,
          dexterity: 2,
          constitution: 2,
          intelligence: 2,
          wisdom: 2,
          charisma: 2,
          keyPhysical: 'strength',
          keyMental: 'wisdom',
        },
      });

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /characters — should return 400 when keyPhysical is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        attributes: {
          ...validBody.attributes,
          keyPhysical: 'intelligence',
        },
      });

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /characters — should return 400 when keyMental is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        attributes: {
          ...validBody.attributes,
          keyMental: 'strength',
        },
      });

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /characters — should create character with multiple motivations and complications', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        narrative: {
          identity: 'Complex Character',
          origin: 'Complex Origin',
          motivations: ['Motivation 1', 'Motivation 2', 'Motivation 3'],
          complications: ['Complication 1', 'Complication 2'],
        },
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.narrative.motivations).toHaveLength(3);
    expect(response.body.narrative.complications).toHaveLength(2);
  });

  test('[POST] /characters — should create character with spiritual principle unlocked', async () => {
    const response = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validBody,
        spiritualPrinciple: {
          isUnlocked: true,
        },
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.spiritualPrinciple.isUnlocked).toBe(true);
  });
});
