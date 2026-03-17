import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "src/app.module";

describe("Auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /auth/register", async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: "user@test.com",
        password: "12345678",
        name: "Test User"
    });

    // Может вернуть 201 при первом создании или 409, если пользователь уже существует
    expect([201, 409]).toContain(res.status);
  });

  it("POST /auth/login", async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: "user@test.com",
        password: "12345678"
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});