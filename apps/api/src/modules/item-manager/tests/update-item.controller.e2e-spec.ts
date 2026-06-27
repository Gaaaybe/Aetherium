import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('UpdateItemController (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let otherToken: string;
  let weaponId: string;

  const weaponBody = {
    tipo: 'weapon',
    nome: 'Machado de Guerra',
    descricao: 'Um pesado machado de guerra capaz de partir armaduras com um único golpe certeiro.',
    dominio: { name: 'arma-branca' },
    custoBase: 12,
    nivelItem: 1,
    danos: [{ dado: '1d10', base: 'FOR', espiritual: false }],
    critMargin: 19,
    critMultiplier: 2,
    alcance: 'natural',
    alcanceExtraMetros: 0,
    isPublic: false,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Updater',
      email: 'item-updater@example.com',
      password: '123456',
    });
    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Other Updater',
      email: 'item-other-updater@example.com',
      password: '123456',
    });

    ownerToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-updater@example.com',
        password: '123456',
      })
    ).body.access_token;

    otherToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-other-updater@example.com',
        password: '123456',
      })
    ).body.access_token;

    const weapon = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(weaponBody);
    weaponId = weapon.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[PUT] /items/:id — should update item fields and return 200', async () => {
    const response = await request(app.getHttpServer())
      .put(`/items/${weaponId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        tipo: 'weapon',
        nome: 'Machado de Guerra Aprimorado',
        alcanceExtraMetros: 1,
        isPublic: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      id: weaponId,
      nome: 'Machado de Guerra Aprimorado',
      isPublic: true,
      tipo: 'weapon',
      alcanceExtraMetros: 1,
    });
  });

  test('[PUT] /items/:id — should return 403 for different user', async () => {
    const response = await request(app.getHttpServer())
      .put(`/items/${weaponId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ tipo: 'weapon', nome: 'Tentativa de Roubo' });

    expect(response.statusCode).toBe(403);
  });

  test('[PUT] /items/:id — should return 404 for nonexistent item', async () => {
    const response = await request(app.getHttpServer())
      .put('/items/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ tipo: 'weapon', nome: 'Não existe nada aqui' });

    expect(response.statusCode).toBe(404);
  });

  test('[PUT] /items/:id — should return 401 without token', async () => {
    const response = await request(app.getHttpServer())
      .put(`/items/${weaponId}`)
      .send({ tipo: 'weapon', nome: 'Sem token' });

    expect(response.statusCode).toBe(401);
  });
});
