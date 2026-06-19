import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('GetItemByIdController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let itemId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Getter',
      email: 'item-getter@example.com',
      password: '123456',
    });

    const auth = await request(app.getHttpServer()).post('/auth').send({
      email: 'item-getter@example.com',
      password: '123456',
    });
    accessToken = auth.body.access_token;

    const item = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'accessory',
        nome: 'Bracelete de Força',
        descricao: 'Um bracelete encantado que amplifica a força física do usuário em combate.',
        dominio: { name: 'natural' },
        custoBase: 10,
        nivelItem: 1,
        isPublic: false,
      });
    itemId = item.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /items/:id — should return 200 with correct shape', async () => {
    const response = await request(app.getHttpServer())
      .get(`/items/${itemId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: itemId,
      tipo: 'accessory',
      nome: 'Bracelete de Força',
      custoBase: 10,
      nivelItem: 1,
      valorBase: 10,
      dominio: expect.objectContaining({ name: 'natural' }),
    });
  });

  test('[GET] /items/:id — should return 404 for nonexistent item', async () => {
    const response = await request(app.getHttpServer())
      .get('/items/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('[GET] /items/:id — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).get(`/items/${itemId}`);

    expect(response.statusCode).toBe(401);
  });
});
