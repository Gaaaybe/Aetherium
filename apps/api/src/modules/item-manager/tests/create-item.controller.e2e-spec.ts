import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('CreateItemController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const weaponBody = {
    tipo: 'weapon',
    nome: 'Espada Longa',
    descricao: 'Uma espada longa de aço forjado com precisão e balanceamento excepcionais.',
    dominio: { name: 'arma-branca' },
    custoBase: 10,
    nivelItem: 1,
    danos: [{ dado: '1d8', base: 'FOR', espiritual: false }],
    critMargin: 18,
    critMultiplier: 2,
    alcance: 'natural',
    alcanceExtraMetros: 0.5,
    isPublic: false,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).post('/users').send({
      name: 'Item Creator',
      email: 'item-creator@example.com',
      password: '123456',
    });

    const auth = await request(app.getHttpServer()).post('/auth').send({
      email: 'item-creator@example.com',
      password: '123456',
    });
    accessToken = auth.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  test('[POST] /items — should create a weapon and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(weaponBody);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      tipo: 'weapon',
      nome: 'Espada Longa',
      isPublic: false,
      danos: [{ dado: '1d8', base: 'for', espiritual: false }],
      critMargin: 18,
      critMultiplier: 2,
      alcance: 'natural',
      alcanceExtraMetros: 0.5,
      upgradeLevel: 0,
    });
  });

  test('[POST] /items — should create a defensive-equipment and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'defensive-equipment',
        nome: 'Armadura de Couro',
        descricao:
          'Uma armadura de couro resistente que oferece proteção básica sem comprometer a mobilidade.',
        dominio: { name: 'natural' },
        custoBase: 8,
        nivelItem: 1,
        tipoEquipamento: 'protecao',
        baseRD: 2,
        isPublic: false,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      tipo: 'defensive-equipment',
      nome: 'Armadura de Couro',
      tipoEquipamento: 'protecao',
      baseRD: 2,
    });
  });

  test('[POST] /items — should create a consumable and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'consumable',
        nome: 'Poção de Cura',
        descricao: 'Uma poção vermelha que restaura pontos de vida quando consumida pelo usuário.',
        dominio: { name: 'natural' },
        custoBase: 5,
        nivelItem: 1,
        descritorEfeito: 'Restaura 2d6+2 PV',
        qtdDoses: 1,
        isRefeicao: false,
        isPublic: true,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      tipo: 'consumable',
      nome: 'Poção de Cura',
      descritorEfeito: 'Restaura 2d6+2 PV',
      qtdDoses: 1,
      isRefeicao: false,
      isPublic: true,
    });
  });

  test('[POST] /items — should create an artifact and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'artifact',
        nome: 'Amuleto Antigo',
        descricao:
          'Um amuleto misterioso de origem desconhecida com inscrições de uma civilização perdida.',
        dominio: { name: 'natural' },
        custoBase: 15,
        nivelItem: 1,
        isPublic: false,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      tipo: 'artifact',
      nome: 'Amuleto Antigo',
      isAttuned: false,
    });
  });

  test('[POST] /items — should create an accessory and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tipo: 'accessory',
        nome: 'Anel de Proteção',
        descricao:
          'Um anel mágico que forma um escudo invisível ao redor do usuário durante combates.',
        dominio: { name: 'natural' },
        custoBase: 12,
        nivelItem: 1,
        isPublic: false,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      tipo: 'accessory',
      nome: 'Anel de Proteção',
    });
  });

  test('[POST] /items — should return 400 for invalid body', async () => {
    const response = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tipo: 'weapon', nome: 'x' }); // nome too short + missing required fields

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /items — should return 400 when non-natural reach has extra meters', async () => {
    const response = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...weaponBody,
        alcance: 'curto',
        alcanceExtraMetros: 0.5,
      });

    expect(response.statusCode).toBe(400);
  });

  test('[POST] /items — should return 401 without token', async () => {
    const response = await request(app.getHttpServer()).post('/items').send(weaponBody);

    expect(response.statusCode).toBe(401);
  });
});
