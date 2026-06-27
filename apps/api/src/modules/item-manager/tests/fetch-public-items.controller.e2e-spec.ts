import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('FetchPublicItemsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Public Fetcher',
      email: 'item-fetcher-public@example.com',
      password: '123456',
    });

    const auth = await request(app.getHttpServer()).post('/auth').send({
      email: 'item-fetcher-public@example.com',
      password: '123456',
    });
    accessToken = auth.body.access_token;

    // Item público (weapon)
    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'weapon',
        nome: 'Lança da Aurora',
        descricao: 'Uma lança sagrada que brilha com a luz do amanhecer, afastando as trevas.',
        dominio: { name: 'arma-branca' },
        custoBase: 14,
        nivelItem: 1,
        danos: [{ dado: '1d6', base: 'DES', espiritual: true }],
        critMargin: 18,
        critMultiplier: 2,
        alcance: 'curto',
        alcanceExtraMetros: 0,
        isPublic: true,
      });

    // Item público (consumable)
    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'consumable',
        nome: 'Erva Medicinal',
        descricao: 'Uma erva com propriedades curativas que alivia ferimentos leves rapidamente.',
        dominio: { name: 'natural' },
        custoBase: 3,
        nivelItem: 1,
        descritorEfeito: 'Restaura 1d4 PV',
        qtdDoses: 3,
        isRefeicao: false,
        isPublic: true,
      });

    // Item privado (não deve aparecer)
    await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'artifact',
        nome: 'Relíquia Secreta',
        descricao: 'Uma relíquia antiga guardada em segredo por gerações da família do portador.',
        dominio: { name: 'natural' },
        custoBase: 20,
        nivelItem: 1,
        isPublic: false,
      });
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /items — should return 200 without authentication', async () => {
    const response = await request(app.getHttpServer()).get('/items');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('[GET] /items — should return only public items', async () => {
    const response = await request(app.getHttpServer()).get('/items');

    expect(response.statusCode).toBe(200);

    const nomes = response.body.map((i: { nome: string }) => i.nome);
    expect(nomes).toContain('Lança da Aurora');
    expect(nomes).toContain('Erva Medicinal');
    expect(nomes).not.toContain('Relíquia Secreta');
  });

  test('[GET] /items — should filter by tipo', async () => {
    const response = await request(app.getHttpServer()).get('/items?tipo=consumable');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    for (const item of response.body) {
      expect(item.tipo).toBe('consumable');
    }
  });

  test('[GET] /items — should return 200 with pagination', async () => {
    const response = await request(app.getHttpServer()).get('/items?page=1');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('[GET] /items — each item should have correct base shape', async () => {
    const response = await request(app.getHttpServer()).get('/items');
    expect(response.statusCode).toBe(200);

    for (const item of response.body) {
      expect(item).toMatchObject({
        id: expect.any(String),
        tipo: expect.any(String),
        nome: expect.any(String),
        descricao: expect.any(String),
        isPublic: true,
        custoBase: expect.any(Number),
        nivelItem: expect.any(Number),
        valorBase: expect.any(Number),
        dominio: expect.objectContaining({ name: expect.any(String) }),
      });
    }
  });
});
