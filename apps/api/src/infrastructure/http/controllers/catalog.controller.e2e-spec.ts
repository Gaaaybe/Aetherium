import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/infrastructure/app.module';

describe('CatalogController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('[GET] /catalog/scales — should return 200 with an object', async () => {
    const response = await request(app.getHttpServer()).get('/catalog/scales');

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(typeof response.body).toBe('object');
  });

  test('[GET] /catalog/universal-table — should return 200 with an object', async () => {
    const response = await request(app.getHttpServer()).get('/catalog/universal-table');

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
  });

  test('[GET] /catalog/domains — should return 200 with an array', async () => {
    const response = await request(app.getHttpServer()).get('/catalog/domains');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
