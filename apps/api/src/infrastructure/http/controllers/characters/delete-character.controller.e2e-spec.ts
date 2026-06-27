import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('DeleteCharacterController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let characterIdToDelete: string;

  const validCharacterBody = {
    narrative: {
      identity: 'Delete Test Character',
      origin: 'Delete Test Origin',
      motivations: ['Delete Test Motivation'],
      complications: ['Delete Test Complication'],
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
      name: 'Delete User',
      email: 'deleteuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'deleteuser@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const createResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validCharacterBody);

    characterIdToDelete = createResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[DELETE] /characters/:characterId — should delete and return 204', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/characters/${characterIdToDelete}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(204);
  });

  test('[DELETE] /characters/:characterId — should return 401 without token', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validCharacterBody);

    const response = await request(app.getHttpServer()).delete(
      `/characters/${createResponse.body.id}`,
    );

    expect(response.statusCode).toBe(401);
  });

  test('[DELETE] /characters/:characterId — should return 404 for non-existent character', async () => {
    const response = await request(app.getHttpServer())
      .delete('/characters/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('[DELETE] /characters/:characterId — should actually delete character from database', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validCharacterBody,
        narrative: {
          ...validCharacterBody.narrative,
          identity: 'Character To Verify Deletion',
        },
      });

    const newCharacterId = createResponse.body.id;

    await request(app.getHttpServer())
      .delete(`/characters/${newCharacterId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const getResponse = await request(app.getHttpServer())
      .get(`/characters/${newCharacterId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getResponse.statusCode).toBe(404);
  });

  test('[DELETE] /characters/:characterId — should return 403 when trying to delete another user character', async () => {
    await request(app.getHttpServer()).post('/users').send({
      name: 'Other User',
      email: 'otheruser@example.com',
      password: '123456',
    });

    const otherUserAuthResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'otheruser@example.com',
      password: '123456',
    });

    const createResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validCharacterBody,
        narrative: {
          ...validCharacterBody.narrative,
          identity: 'Protected Character',
        },
      });

    const protectedCharacterId = createResponse.body.id;

    const response = await request(app.getHttpServer())
      .delete(`/characters/${protectedCharacterId}`)
      .set('Authorization', `Bearer ${otherUserAuthResponse.body.access_token}`);

    expect(response.statusCode).toBe(403);
  });
});
