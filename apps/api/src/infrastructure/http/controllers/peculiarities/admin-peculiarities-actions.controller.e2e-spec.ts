import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Admin Peculiarities Actions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let playerAccessToken: string;
  let testPeculiarityId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    // Create Admin User
    await request(app.getHttpServer()).post('/users').send({
      name: 'Admin Pec User',
      email: 'adminpec@example.com',
      password: 'adminpassword123',
    });

    // Promotes user to ADMIN
    const dbAdminUser = await prisma.user.findUnique({
      where: { email: 'adminpec@example.com' },
    });
    await prisma.user.update({
      where: { id: dbAdminUser!.id },
      data: { roles: ['PLAYER', 'ADMIN'] },
    });

    // Get Admin JWT
    adminAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'adminpec@example.com',
        password: 'adminpassword123',
      })
    ).body.access_token;

    // Create Normal Player User
    await request(app.getHttpServer()).post('/users').send({
      name: 'Normal Player Pec User',
      email: 'playerpec@example.com',
      password: 'playerpassword123',
    });

    // Get Player JWT
    playerAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'playerpec@example.com',
        password: 'playerpassword123',
      })
    ).body.access_token;

    // Create a private peculiarity for the player
    const dbPlayerUser = await prisma.user.findUnique({
      where: { email: 'playerpec@example.com' },
    });
    const peculiarity = await prisma.peculiarity.create({
      data: {
        userId: dbPlayerUser!.id,
        nome: 'Peculiaridade Secreta Player',
        descricao: 'Apenas para este jogador',
        espiritual: false,
        isPublic: false,
      },
    });
    testPeculiarityId = peculiarity.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/peculiarities', () => {
    test('should reject requests from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/peculiarities')
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to list all peculiarities', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/peculiarities')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const foundPec = response.body.find((p) => p.id === testPeculiarityId);
      expect(foundPec).toBeDefined();
      expect(foundPec.nome).toBe('Peculiaridade Secreta Player');
    });
  });

  describe('PATCH /admin/peculiarities/:peculiarityId/promote', () => {
    test('should reject promotion from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/peculiarities/${testPeculiarityId}/promote`)
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to promote peculiarity to official', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/peculiarities/${testPeculiarityId}/promote`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isPublic).toBe(true);

      // Verify in DB that userId is indeed null (making it system-wide official)
      const dbPec = await prisma.peculiarity.findUnique({
        where: { id: testPeculiarityId },
      });
      expect(dbPec!.userId).toBeNull();
      expect(dbPec!.isPublic).toBe(true);
    });
  });

  describe('PUT /peculiarities/:peculiarityId (Admin update)', () => {
    test('should allow admin to edit other users peculiarities', async () => {
      const response = await request(app.getHttpServer())
        .put(`/peculiarities/${testPeculiarityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          nome: 'Peculiaridade Atualizada Pelo Admin',
          descricao: 'Descricao editada pelo admin',
          espiritual: true,
          isPublic: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.nome).toBe('Peculiaridade Atualizada Pelo Admin');
    });
  });

  describe('DELETE /peculiarities/:peculiarityId (Admin delete)', () => {
    test('should allow admin to delete other users peculiarities', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/peculiarities/${testPeculiarityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(204);

      // Check it doesn't exist in DB anymore
      const dbPec = await prisma.peculiarity.findUnique({
        where: { id: testPeculiarityId },
      });
      expect(dbPec).toBeNull();
    });
  });
});
