import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('UpdateItemPowerController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let otherToken: string;
  let sourcePowerId: string;
  let sourcePowerUpdatedAt: string;
  let firstItemId: string;
  let secondItemId: string;
  let isolatedPowerId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    await prisma.effectBase.upsert({
      where: { id: 'dano' },
      create: {
        id: 'dano', nome: 'Dano', custoBase: 2, descricao: 'Causa dano.',
        categorias: ['Ataque'], parametrosPadraoAcao: 1,
        parametrosPadraoAlcance: 1, parametrosPadraoDuracao: 0, requerInput: false,
      },
      update: {},
    });

    for (const user of [
      { name: 'Item Power Owner', email: 'item-power-owner@example.com' },
      { name: 'Item Power Other', email: 'item-power-other@example.com' },
    ]) {
      await request(app.getHttpServer()).post('/users').send({ ...user, password: '123456' });
    }
    ownerToken = (await request(app.getHttpServer()).post('/auth').send({
      email: 'item-power-owner@example.com', password: '123456',
    })).body.access_token;
    otherToken = (await request(app.getHttpServer()).post('/auth').send({
      email: 'item-power-other@example.com', password: '123456',
    })).body.access_token;

    const power = await request(app.getHttpServer()).post('/powers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        nome: 'Poder compartilhado', descricao: 'Poder usado por dois itens.',
        dominio: { name: 'natural' }, parametros: { acao: 1, alcance: 1, duracao: 0 },
        effects: [{ effectBaseId: 'dano', grau: 2, dadoModularizado: '4d16', modifications: [] }],
        globalModifications: [], isPublic: false,
      });
    sourcePowerId = power.body.id;
    sourcePowerUpdatedAt = power.body.updatedAt;

    for (const nome of ['Primeiro item', 'Segundo item']) {
      const item = await request(app.getHttpServer()).post('/items')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          tipo: 'general', nome, descricao: 'Item de teste para isolamento de poder.',
          dominio: { name: 'natural' }, custoBase: 1, nivelItem: 1,
          powerIds: [sourcePowerId], isPublic: false,
        });
      if (!firstItemId) firstItemId = item.body.id;
      else secondItemId = item.body.id;
    }
  });

  afterAll(async () => app.close());

  test('isolates a library item power and preserves the original', async () => {
    const response = await request(app.getHttpServer())
      .put(`/items/${firstItemId}/powers/${sourcePowerId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('If-Match', sourcePowerUpdatedAt)
      .send({ nome: 'Poder exclusivo', effects: [{
        effectBaseId: 'dano', grau: 4, dadoModularizado: '4d16', modifications: [],
      }] });

    expect(response.statusCode).toBe(200);
    expect(response.body.isolated).toBe(true);
    expect(response.body.power.id).not.toBe(sourcePowerId);
    isolatedPowerId = response.body.power.id;
    expect(response.body.power.nome).toBe('Poder exclusivo');
    expect(response.body.power.effects[0].dadoModularizado).toBe('4d16');
    expect(response.body.item.powerIds).toContain(response.body.power.id);

    const original = await prisma.power.findUnique({ where: { id: sourcePowerId } });
    const secondLink = await prisma.itemPower.findFirst({ where: { itemId: secondItemId } });
    const firstLink = await prisma.itemPower.findFirst({ where: { itemId: firstItemId } });
    expect(original?.nome).toBe('Poder compartilhado');
    expect(secondLink?.powerId).toBe(sourcePowerId);
    expect(firstLink?.ownsPower).toBe(true);

    const listed = await request(app.getHttpServer())
      .get('/powers/me')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(listed.body.map((power: { id: string }) => power.id)).toContain(sourcePowerId);
    expect(listed.body.map((power: { id: string }) => power.id)).not.toContain(response.body.power.id);

    const secondEdit = await request(app.getHttpServer())
      .put(`/items/${firstItemId}/powers/${response.body.power.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('If-Match', response.body.power.updatedAt)
      .send({ nome: 'Poder exclusivo novamente' });
    expect(secondEdit.statusCode).toBe(200);
    expect(secondEdit.body.isolated).toBe(false);
    expect(secondEdit.body.power.id).toBe(response.body.power.id);

    const staleEdit = await request(app.getHttpServer())
      .put(`/items/${firstItemId}/powers/${response.body.power.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('If-Match', response.body.power.updatedAt)
      .send({ nome: 'Sobrescrita antiga' });
    expect(staleEdit.statusCode).toBe(409);
    expect((await prisma.power.findUnique({ where: { id: response.body.power.id } }))?.nome)
      .toBe('Poder exclusivo novamente');
  });

  test('rejects an edit from another user', async () => {
    const response = await request(app.getHttpServer())
      .put(`/items/${secondItemId}/powers/${sourcePowerId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ nome: 'Tentativa indevida' });
    expect(response.statusCode).toBe(403);
  });

  test('exports and imports the edited item without losing modular dice', async () => {
    const exported = await request(app.getHttpServer())
      .get(`/items/${firstItemId}/export`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(exported.statusCode).toBe(200);
    expect(exported.body.schemaVersion).toBe(2);
    expect(exported.body.powers[0].effects[0].dadoModularizado).toBe('4d16');

    const imported = await request(app.getHttpServer())
      .post('/items/import')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(exported.body);
    expect(imported.statusCode).toBe(201);
    expect(imported.body.importWarnings).toEqual([]);
    const importedPower = await prisma.power.findUnique({
      where: { id: imported.body.powerIds[0] },
      include: { appliedEffects: true },
    });
    expect(importedPower?.appliedEffects[0].dadoModularizado).toBe('4d16');
  });

  test('deletes an exclusively owned power together with its item', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/items/${firstItemId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(response.statusCode).toBe(204);
    expect(await prisma.power.findUnique({ where: { id: isolatedPowerId } })).toBeNull();
    expect(await prisma.power.findUnique({ where: { id: sourcePowerId } })).not.toBeNull();
  });
});
