import { AppModule } from '@/infrastructure/app.module'
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { describe, beforeAll, test, expect } from 'vitest'


describe('Register user controller (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /users — should create a user and return 201', async () => {
    const response = await request(app.getHttpServer()).post('/users').send({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
      masterConfirm: true,
    });

    expect(response.statusCode).toBe(201);
  });

  test('[POST] /users — should return 409 when email already exists', async () => {
    const body = {
      name: 'John Doe',
      email: 'duplicate@example.com',
      password: '123456',
      masterConfirm: true,
    };

    await request(app.getHttpServer()).post('/users').send(body);

    const response = await request(app.getHttpServer()).post('/users').send(body);

    expect(response.statusCode).toBe(409);
  });

  test('[POST] /users — should return 400 when body is invalid', async () => {
    const response = await request(app.getHttpServer()).post('/users').send({
      name: 'J', // min 2 chars
      email: 'not-an-email',
      password: '123', // min 6 chars
      masterConfirm: 'not-a-boolean', // should be boolean
    });

    expect(response.statusCode).toBe(400);
  });
});
