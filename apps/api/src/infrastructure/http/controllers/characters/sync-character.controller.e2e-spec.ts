import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('SyncCharacterController (e2e)', () => {
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
      name: 'Sync User',
      email: 'syncuser@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'syncuser@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const createResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'Original Identity',
          origin: 'Original Origin',
          motivations: ['M1'],
          complications: ['C1'],
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

  test('[PATCH] /characters/:id/sync — should sync narrative and inspiration', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/sync`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'New Identity',
          origin: 'New Origin',
          motivations: ['M2'],
          complications: ['C2'],
        },
        inspiration: 3,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.narrative.identity).toBe('New Identity');
    expect(response.body.inspiration).toBe(3);
  });

  test('[PATCH] /characters/:id/sync — should sync health and energy changes', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/sync`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        pvChange: -2,
        peChange: -1,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.health.currentPV).toBeLessThan(response.body.health.maxPV);
    expect(response.body.energy.currentPE).toBeLessThan(response.body.energy.maxPE);
  });

  test('[PATCH] /characters/:id/sync — should sync attributes', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/sync`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        attributes: {
          strength: { baseValue: 12 },
          dexterity: { baseValue: 11 },
          constitution: { baseValue: 11 },
          intelligence: { baseValue: 11 },
          wisdom: { baseValue: 11 },
          charisma: { baseValue: 11 },
          keyPhysical: 'constitution',
          keyMental: 'intelligence',
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.attributes.strength.baseValue).toBe(12);
    expect(response.body.attributes.keyPhysical).toBe('constitution');
  });

  test('[PATCH] /characters/:id/sync — should sync skills', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/sync`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        skills: [
          { name: 'Acrobacia', state: 'EFFICIENT', trainingBonus: 2 },
          { name: 'Atletismo', state: 'INEFFICIENT' },
        ],
      });

    expect(response.statusCode).toBe(200);
    const acrobacia = response.body.skills.find((s: any) => s.name === 'Acrobacia');
    expect(acrobacia.proficiencyState).toBe('EFFICIENT');
    expect(acrobacia.trainingBonus).toBe(2);

    const atletismo = response.body.skills.find((s: any) => s.name === 'Atletismo');
    expect(atletismo.proficiencyState).toBe('INEFFICIENT');
  });

  test('[PATCH] /characters/:id/sync — should sync conditions', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/characters/${characterId}/sync`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        conditions: ['Abalado', 'Caído'],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.conditions).toContain('Abalado');
    expect(response.body.conditions).toContain('Caído');
  });
});
