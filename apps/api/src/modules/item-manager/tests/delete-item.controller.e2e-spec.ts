import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('DeleteItemController (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let otherToken: string;

  const makeConsumable = () => ({
    tipo: 'consumable',
    nome: 'Elixir de Agilidade',
    descricao: 'Um elixir que temporariamente aumenta a agilidade e reflexos do consumidor.',
    dominio: { name: 'natural' },
    custoBase: 6,
    nivelItem: 1,
    descritorEfeito: '+2 Agilidade por 1 hora',
    qtdDoses: 1,
    isRefeicao: false,
    isPublic: false,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Deleter',
      email: 'item-deleter@example.com',
      password: '123456',
    });
    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Other Deleter',
      email: 'item-other-deleter@example.com',
      password: '123456',
    });

    ownerToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-deleter@example.com',
        password: '123456',
      })
    ).body.access_token;

    otherToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-other-deleter@example.com',
        password: '123456',
      })
    ).body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[DELETE] /items/:id — should return 204 on success', async () => {
    const created = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(makeConsumable());
    const itemId = created.body.id;

    const response = await request(app.getHttpServer())
      .delete(`/items/${itemId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.statusCode).toBe(204);
  });

  test('[DELETE] /items/:id — should return 403 for different user', async () => {
    const created = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(makeConsumable());
    const itemId = created.body.id;

    const response = await request(app.getHttpServer())
      .delete(`/items/${itemId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.statusCode).toBe(403);
  });

  test('[DELETE] /items/:id — should return 404 for nonexistent item', async () => {
    const response = await request(app.getHttpServer())
      .delete('/items/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('[DELETE] /items/:id — should return 401 without token', async () => {
    const created = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(makeConsumable());
    const itemId = created.body.id;

    const response = await request(app.getHttpServer()).delete(`/items/${itemId}`);

    expect(response.statusCode).toBe(401);
  });
});
