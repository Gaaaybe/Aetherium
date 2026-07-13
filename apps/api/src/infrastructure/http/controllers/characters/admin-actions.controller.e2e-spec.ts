import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('Admin Actions (e2e)', () => {
  let app: INestApplication;
  let playerToken: string;
  let adminToken: string;
  let characterId: string;
  let player2Id: string;

  const validCharacterBody = {
    narrative: {
      identity: 'Admin Test Character',
      origin: 'Admin Test Origin',
      motivations: ['Admin Test Motivation'],
      complications: ['Admin Test Complication'],
    },
    attributes: {
      strength: 2,
      dexterity: 2,
      constitution: 2,
      intelligence: 2,
      wisdom: 2,
      charisma: 2,
      keyPhysical: 'strength',
      keyMental: 'wisdom',
    },
    spiritualPrinciple: {
      isUnlocked: false,
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // 1. Create a regular player
    await request(app.getHttpServer()).post('/users').send({
      name: 'Player One',
      email: 'player1@example.com',
      password: '123456',
    });

    const playerAuthResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'player1@example.com',
      password: '123456',
    });
    playerToken = playerAuthResponse.body.access_token;

    // 2. Create another regular player (target of transfer)
    await request(app.getHttpServer()).post('/users').send({
      name: 'Player Two',
      email: 'player2@example.com',
      password: '123456',
    });

    const player2AuthResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'player2@example.com',
      password: '123456',
    });

    // We can decode player2's token to get their user ID, or fetch user list as Admin
    // Let's create an Admin user
    await request(app.getHttpServer()).post('/users').send({
      name: 'Admin User',
      email: 'adminuser@example.com',
      password: '123456',
      masterConfirm: true,
    });

    const adminAuthResponse = await request(app.getHttpServer()).post('/auth').send({
      email: 'adminuser@example.com',
      password: '123456',
    });
    adminToken = adminAuthResponse.body.access_token;

    // 3. Create a character owned by Player One
    const createResponse = await request(app.getHttpServer())
      .post('/characters')
      .set('Authorization', `Bearer ${playerToken}`)
      .send(validCharacterBody);

    characterId = createResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/users', () => {
    test('should reject requests from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${playerToken}`);

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to list all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3); // player1, player2, admin

      const p2 = response.body.find((u: any) => u.email === 'player2@example.com');
      expect(p2).toBeDefined();
      player2Id = p2.id;
    });
  });

  describe('PATCH /admin/characters/:characterId/owner', () => {
    test('should reject owner transfer from non-admins', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/characters/${characterId}/owner`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          newOwnerId: player2Id,
        });

      expect(response.statusCode).toBe(403);
    });

    test('should allow admins to transfer character ownership', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/characters/${characterId}/owner`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newOwnerId: player2Id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toBe(player2Id);
    });
  });
});
