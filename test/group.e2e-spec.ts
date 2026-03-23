import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';
import * as bcrypt from 'bcrypt';

describe('Group (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // --- Очистка таблиц ---
    await prisma.assignment.deleteMany(); // добавить
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    // --- Создаём пользователя ---
    const hashedPassword = await bcrypt.hash('12345678', 10);
    await prisma.user.create({
      data: {
        email: 'owner@test.com',
        password: hashedPassword,
        name: 'Owner',
      },
    });

    // --- Логинимся ---
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@test.com', password: '12345678' });

    expect(login.status).toBe(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /group/create - должно создать группу', async () => {
    const res = await request(app.getHttpServer())
      .post('/group/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Group' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Group');
  });

  it('POST /group/create - не может создать дубликат группы', async () => {
    const res = await request(app.getHttpServer())
      .post('/group/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Group' });

    expect(res.status).toBe(409);
  });
});
