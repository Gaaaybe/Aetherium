import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Admin Power Arrays Actions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let playerAccessToken: string;
  let testPowerId: string;
  let testPowerArrayId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    // Ensure we have a default effect base
    await prisma.effectBase.upsert({
      where: { id: 'dano' },
      create: {
        id: 'dano',
        nome: 'Dano',
        custoBase: 2,
        descricao: 'Causa dano a um alvo.',
        categorias: ['Ataque'],
        parametrosPadraoAcao: 1,
        parametrosPadraoAlcance: 1,
        parametrosPadraoDuracao: 0,
        requerInput: false,
      },
      update: {},
    });

    // Create Admin User
    await request(app.getHttpServer()).post('/users').send({
      name: 'Admin Array User',
      email: 'adminarrays@example.com',
      password: 'adminpassword123',
    });

    // Promotes user to ADMIN
    const dbAdminUser = await prisma.user.findUnique({
      where: { email: 'adminarrays@example.com' },
    });
    await prisma.user.update({
      where: { id: dbAdminUser!.id },
      data: { roles: ['PLAYER', 'ADMIN'] },
    });

    // Get Admin JWT
    adminAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'adminarrays@example.com',
        password: 'adminpassword123',
      })
    ).body.access_token;

    // Create Normal Player User
    await request(app.getHttpServer()).post('/users').send({
      name: 'Normal Player Array User',
      email: 'playerarrays@example.com',
      password: 'playerpassword123',
    });

    // Get Player JWT
    playerAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'playerarrays@example.com',
        password: 'playerpassword123',
      })
    ).body.access_token;

    // Create a private power for the player
    const powerResponse = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${playerAccessToken}`)
      .send({
        nome: 'Poder Secreto Player Array',
        descricao: 'Apenas para este jogador',
        isPublic: false,
        dominio: { name: 'natural' },
        parametros: { acao: 1, alcance: 1, duracao: 0 },
        effects: [{ effectBaseId: 'dano', grau: 1, modifications: [] }],
        globalModifications: [],
      });
    testPowerId = powerResponse.body.id;

    // Create a private power array for the player
    const powerArrayResponse = await request(app.getHttpServer())
      .post('/power-arrays')
      .set('Authorization', `Bearer ${playerAccessToken}`)
      .send({
        nome: 'Acervo Secreto Player',
        descricao: 'Acervo privado',
        dominio: { name: 'natural' },
        powerIds: [testPowerId],
        isPublic: false,
      });
    testPowerArrayId = powerArrayResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/power-arrays', () => {
    test('should reject requests from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/power-arrays')
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to list all power arrays', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/power-arrays')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const foundArray = response.body.find((a) => a.id === testPowerArrayId);
      expect(foundArray).toBeDefined();
      expect(foundArray.nome).toBe('Acervo Secreto Player');
    });
  });

  describe('PATCH /admin/power-arrays/:powerArrayId/promote', () => {
    test('should reject promotion from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/power-arrays/${testPowerArrayId}/promote`)
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to promote power array to official', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/power-arrays/${testPowerArrayId}/promote`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isPublic).toBe(true);

      // Verify in DB that userId is indeed null (making it system-wide official)
      const dbArray = await prisma.powerArray.findUnique({
        where: { id: testPowerArrayId },
      });
      expect(dbArray!.userId).toBeNull();
      expect(dbArray!.isPublic).toBe(true);
    });
  });

  describe('PUT /power-arrays/:powerArrayId (Admin update)', () => {
    test('should allow admin to edit other users power arrays', async () => {
      const response = await request(app.getHttpServer())
        .put(`/power-arrays/${testPowerArrayId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          nome: 'Acervo Atualizado Pelo Admin',
          descricao: 'Descricao editada pelo admin',
          dominio: { name: 'natural' },
          powerIds: [testPowerId],
          isPublic: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.nome).toBe('Acervo Atualizado Pelo Admin');
    });
  });

  describe('DELETE /power-arrays/:powerArrayId (Admin delete)', () => {
    test('should allow admin to delete other users power arrays', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/power-arrays/${testPowerArrayId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(204);

      // Check it doesn't exist in DB anymore
      const dbArray = await prisma.powerArray.findUnique({
        where: { id: testPowerArrayId },
      });
      expect(dbArray).toBeNull();
    });
  });
});
