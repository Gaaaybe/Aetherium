import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Evolve Spiritual Principle (e2e)', () => {
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
      name: 'Evolve User',
      email: 'evolve@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'evolve@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const createCharResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'Evolve Tester',
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

    const dbCharacter = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (dbCharacter) {
      const pdaState = dbCharacter.pdaState as any;
      pdaState.totalPda = 100;
      await prisma.character.update({
        where: { id: characterId },
        data: {
          level: 35,
          pdaState,
          spiritualPrinciple: {
            isUnlocked: true,
            stage: 'NORMAL',
          },
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /characters/:id/spiritual-evolution', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/spiritual-evolution`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.spiritualPrinciple.stage).toBe('DIVINE');
  });
});
