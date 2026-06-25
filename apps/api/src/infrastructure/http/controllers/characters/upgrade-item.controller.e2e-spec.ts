import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Upgrade Item (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let characterId: string;
  let itemId: string;
  let materialId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Upgrade User',
      email: 'upgrade@example.com',
      password: '123456',
    });

    const authResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'upgrade@example.com',
      password: '123456',
    });

    accessToken = authResponse.body.access_token;

    const createCharResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        narrative: {
          identity: 'Upgrade Tester',
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

    const itemResponse = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'weapon',
        nome: 'Base Sword',
        descricao: 'A sword to upgrade',
        dominio: { name: 'arma-branca' },
        custoBase: 100,
        danos: [{ dado: '1d8', base: 'corte', espiritual: false }],
        critMargin: 2,
        critMultiplier: 2,
        alcance: 'natural',
        isPublic: true,
      });

    const templateId = itemResponse.body.id;

    const cloneResponse = await request(app.getHttpServer())
      .post(`/characters/${characterId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemId: templateId, quantity: 1 });

    itemId = cloneResponse.body.inventory.bag[0].itemId;

    const materialResponse = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'upgrade-material',
        nome: 'Uranita',
        descricao: 'Material de aprimoramento',
        dominio: { name: 'sagrado' },
        custoBase: 500,
        tier: 1,
        maxUpgradeLimit: 2,
        isPublic: true,
      });

    const materialTemplateId = materialResponse.body.id;

    const materialCloneResponse = await request(app.getHttpServer())
      .post(`/characters/${characterId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemId: materialTemplateId, quantity: 1 });

    materialId = materialCloneResponse.body.inventory.bag.find(
      (i: any) => i.itemId !== itemId,
    ).itemId;

    await request(app.getHttpServer())
      .post(`/characters/${characterId}/runics/add`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 1000 });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /characters/:id/items/:itemId/upgrade', async () => {
    const response = await request(app.getHttpServer())
      .post(`/characters/${characterId}/items/${itemId}/upgrade`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ materialId, runicsCost: 500 });

    if (response.statusCode !== 200) {
      console.error('Upgrade failed:', response.body);
    }

    expect(response.statusCode).toBe(200);
    expect(response.body.inventory.runics).toBe(500);
  });
});
