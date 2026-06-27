import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('FetchUserItemsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let otherToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Item User Fetcher',
      email: 'item-fetcher-user@example.com',
      password: '123456',
    });
    await request(app.getHttpServer()).post('/users').send({
      name: 'Item User Other',
      email: 'item-fetcher-other@example.com',
      password: '123456',
    });

    accessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-fetcher-user@example.com',
        password: '123456',
      })
    ).body.access_token;

    otherToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'item-fetcher-other@example.com',
        password: '123456',
      })
    ).body.access_token;

    // Cria 2 itens para o usuário principal
    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'weapon',
        nome: 'Adaga Veloz',
        descricao: 'Uma adaga leve e equilibrada, perfeita para ataques rápidos e precisos.',
        dominio: { name: 'arma-branca' },
        custoBase: 6,
        nivelItem: 1,
        danos: [{ dado: '1d4', base: 'DES', espiritual: false }],
        critMargin: 17,
        critMultiplier: 2,
        alcance: 'adjacente',
        alcanceExtraMetros: 0,
        isPublic: false,
      });

    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'accessory',
        nome: 'Capa de Invisibilidade',
        descricao: 'Uma capa encantada que torna o usuário difícil de ser rastreado por inimigos.',
        dominio: { name: 'natural' },
        custoBase: 18,
        nivelItem: 1,
        isPublic: false,
      });

    // Item do outro usuário (não deve aparecer em /items/me)
    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        tipo: 'artifact',
        nome: 'Pedra do Outro Usuário',
        descricao: 'Item pertencente a outro usuário que não deve aparecer na listagem pessoal.',
        dominio: { name: 'natural' },
        custoBase: 10,
        nivelItem: 1,
        isPublic: false,
      });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /items/me — should return only the authenticated user items', async () => {
    const response = await request(app.getHttpServer())
      .get('/items/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const nomes = response.body.map((i: { nome: string }) => i.nome);
    expect(nomes).toContain('Adaga Veloz');
    expect(nomes).toContain('Capa de Invisibilidade');
    expect(nomes).not.toContain('Pedra do Outro Usuário');
  });

  test('[GET] /items/me — should filter by tipo', async () => {
    const response = await request(app.getHttpServer())
      .get('/items/me?tipo=weapon')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    for (const item of response.body) {
      expect(item.tipo).toBe('weapon');
    }

    const nomes = response.body.map((i: { nome: string }) => i.nome);
    expect(nomes).toContain('Adaga Veloz');
    expect(nomes).not.toContain('Capa de Invisibilidade');
  });

  test('[GET] /items/me — each item should have the authenticated userId', async () => {
    const response = await request(app.getHttpServer())
      .get('/items/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);

    for (const item of response.body) {
      expect(item.userId).toBeDefined();
    }
  });

  test('[GET] /items/me — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).get('/items/me');

    expect(response.statusCode).toBe(401);
  });
});
