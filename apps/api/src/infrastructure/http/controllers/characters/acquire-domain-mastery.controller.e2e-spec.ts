import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Acquire Domain Mastery (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let characterId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Domain User',
      email: 'domain@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'domain@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const createCharResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'Domain Tester',
          origin: 'Lab',
          motivations: ['Testing'],
          complications: ['Bugs'],
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
        spiritualPrinciple: { isUnlocked: false },
      });

    characterId = createCharResponse.body.id;

    await request(app.getHttpServer())
      .post(`/characters/${characterId}/level-up`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /characters/:id/domains', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/domains`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ domainId: 'arma-branca', masteryLevel: 'INICIANTE' });

    expect(response.statusCode).toBe(201);
    expect(response.body.domainMasteries).toContainEqual(expect.objectContaining({ domainId: 'arma-branca' }));
  });
});
