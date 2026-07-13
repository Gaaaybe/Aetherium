import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

describe('Admin Powers Actions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let playerAccessToken: string;
  let testPowerId: string;

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
      name: 'Admin Power User',
      email: 'adminpowers@example.com',
      password: 'adminpassword123',
    });

    // Promotes user to ADMIN
    const dbAdminUser = await prisma.user.findUnique({
      where: { email: 'adminpowers@example.com' },
    });
    await prisma.user.update({
      where: { id: dbAdminUser!.id },
      data: { roles: ['PLAYER', 'ADMIN'] },
    });

    // Get Admin JWT
    adminAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'adminpowers@example.com',
        password: 'adminpassword123',
      })
    ).body.access_token;

    // Create Normal Player User
    await request(app.getHttpServer()).post('/users').send({
      name: 'Normal Player User',
      email: 'playerpowers@example.com',
      password: 'playerpassword123',
    });

    // Get Player JWT
    playerAccessToken = (
      await request(app.getHttpServer()).post('/auth').send({
        email: 'playerpowers@example.com',
        password: 'playerpassword123',
      })
    ).body.access_token;

    // Create a private power for the player
    const powerResponse = await request(app.getHttpServer())
      .post('/powers')
      .set('Authorization', `Bearer ${playerAccessToken}`)
      .send({
        nome: 'Poder Secreto Player',
        descricao: 'Apenas para este jogador',
        isPublic: false,
        dominio: { name: 'natural' },
        parametros: { acao: 1, alcance: 1, duracao: 0 },
        effects: [{ effectBaseId: 'dano', grau: 1, modifications: [] }],
        globalModifications: [],
      });

    testPowerId = powerResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/powers', () => {
    test('should reject requests from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/powers')
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to list all powers (including private ones)', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/powers')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const foundTestPower = response.body.find((p) => p.id === testPowerId);
      expect(foundTestPower).toBeDefined();
      expect(foundTestPower.nome).toBe('Poder Secreto Player');
    });
  });

  describe('PATCH /admin/powers/:powerId/promote', () => {
    test('should reject promotion from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/powers/${testPowerId}/promote`)
        .set('Authorization', `Bearer ${playerAccessToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to promote power to official', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/powers/${testPowerId}/promote`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isPublic).toBe(true);

      // Verify in DB that userId is indeed null (making it system-wide official)
      const dbPower = await prisma.power.findUnique({
        where: { id: testPowerId },
      });
      expect(dbPower!.userId).toBeNull();
      expect(dbPower!.isPublic).toBe(true);
    });
  });
});
