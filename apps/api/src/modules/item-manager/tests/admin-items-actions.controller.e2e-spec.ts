import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Admin Items Actions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let playerAccessToken: string;
  let testItemId: string;

  const makeConsumable = () => ({
    tipo: 'consumable',
    nome: 'Elixir do Admin',
    descricao: 'Um item de teste criado por jogador.',
    dominios: [{ name: 'natural' }],
    custoBase: 5,
    descritorEfeito: '+1 Força por 5 minutos',
    qtdDoses: 1,
    isRefeicao: false,
    isPublic: false,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    // Create Admin User
    await request(app.getHttpServer()).post('/users').send({
      name: 'Admin Item User',
      email: 'adminitems@example.com',
      password: 'adminpassword123',
    });

    // Promotes user to ADMIN
    const dbAdminUser = await prisma.user.findUnique({
      where: { email: 'adminitems@example.com' },
    });
    await prisma.user.update({
      where: { id: dbAdminUser!.id },
      data: { roles: ['PLAYER', 'ADMIN'] },
    });

    // Get Admin JWT
    adminAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'adminitems@example.com',
        password: 'adminpassword123',
      })
    ).body.access_token;

    // Create Normal Player User
    await request(app.getHttpServer()).post('/users').send({
      name: 'Normal Player User',
      email: 'playeritems@example.com',
      password: 'playerpassword123',
    });

    // Get Player JWT
    playerAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'playeritems@example.com',
        password: 'playerpassword123',
      })
    ).body.access_token;

    // Create a private item for the player
    const itemResponse = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${playerAccessToken}`)
      .send(makeConsumable());

    testItemId = itemResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/items', () => {
    test('should reject requests from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/items')
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to list all user items', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/items')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const foundTestItem = response.body.find((item) => item.id === testItemId);
      expect(foundTestItem).toBeDefined();
      expect(foundTestItem.nome).toBe('Elixir do Admin');
    });
  });

  describe('PATCH /admin/items/:itemId/promote', () => {
    test('should reject promotion from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/items/${testItemId}/promote`)
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to promote item to official', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/items/${testItemId}/promote`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isPublic).toBe(true);

      // Verify in DB that userId is indeed null (making it system-wide official)
      const dbItem = await prisma.item.findUnique({
        where: { id: testItemId },
      });
      expect(dbItem!.userId).toBeNull();
      expect(dbItem!.isPublic).toBe(true);
    });
  });

  describe('PUT /items/:itemId (Admin update)', () => {
    test('should allow admin to edit other users items', async () => {
      // First, create a new item for player
      const newItemResponse = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${playerAccessToken}`)
        .send(makeConsumable());
      const itemToEditId = newItemResponse.body.id;

      // Admin updates it
      const response = await request(app.getHttpServer())
        .put(`/items/${itemToEditId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          tipo: 'consumable',
          nome: 'Elixir Atualizado por Admin',
          dominios: [{ name: 'sagrado' }],
          custoBase: 10,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.nome).toBe('Elixir Atualizado por Admin');
    });
  });

  describe('DELETE /items/:itemId (Admin delete)', () => {
    test('should allow admin to delete other users items', async () => {
      // Create another item
      const newItemResponse = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${playerAccessToken}`)
        .send(makeConsumable());
      const itemToDeleteId = newItemResponse.body.id;

      // Admin deletes it
      const response = await request(app.getHttpServer())
        .delete(`/items/${itemToDeleteId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(204);

      // Verify it is gone
      const dbItem = await prisma.item.findUnique({
        where: { id: itemToDeleteId },
      });
      expect(dbItem).toBeNull();
    });
  });
});
