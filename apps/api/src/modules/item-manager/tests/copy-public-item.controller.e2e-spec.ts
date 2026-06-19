import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('CopyPublicItemController (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let otherToken: string;
  let publicItemId: string;
  let privateItemId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Copy Owner',
      email: 'item-copy-owner@example.com',
      password: '123456',
    });
    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Copy Other',
      email: 'item-copy-other@example.com',
      password: '123456',
    });

    ownerToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-copy-owner@example.com',
        password: '123456',
      })
    ).body.access_token;

    otherToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-copy-other@example.com',
        password: '123456',
      })
    ).body.access_token;

    const publicItem = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        tipo: 'consumable',
        nome: 'Poção Copiável',
        descricao: 'Esta poção pública pode ser copiada por qualquer usuário do sistema.',
        dominio: { name: 'natural' },
        custoBase: 4,
        nivelItem: 1,
        descritorEfeito: 'Restaura 1d4+1 PV',
        qtdDoses: 2,
        isRefeicao: false,
        isPublic: true,
      });
    publicItemId = publicItem.body.id;

    const privateItem = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        tipo: 'consumable',
        nome: 'Poção Privada',
        descricao: 'Esta poção privada não pode ser copiada por outros usuários do sistema.',
        dominio: { name: 'natural' },
        custoBase: 4,
        nivelItem: 1,
        descritorEfeito: 'Restaura 1d4+1 PV',
        qtdDoses: 2,
        isRefeicao: false,
        isPublic: false,
      });
    privateItemId = privateItem.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /items/:id/copy — should return 201 with copied item', async () => {
    const response = await request(app.getHttpServer())
      .post(`/items/${publicItemId}/copy`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      nome: 'Poção Copiável',
      isPublic: false,
      tipo: 'consumable',
    });
    expect(response.body.id).not.toBe(publicItemId);
  });

  test('[POST] /items/:id/copy — should return 403 for private item', async () => {
    const response = await request(app.getHttpServer())
      .post(`/items/${privateItemId}/copy`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.statusCode).toBe(403);
  });

  test('[POST] /items/:id/copy — should return 404 for nonexistent item', async () => {
    const response = await request(app.getHttpServer())
      .post('/items/00000000-0000-0000-0000-000000000000/copy')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('[POST] /items/:id/copy — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).post(`/items/${publicItemId}/copy`);

    expect(response.statusCode).toBe(401);
  });
});
