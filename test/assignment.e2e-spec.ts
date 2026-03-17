import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/prisma/prisma.service";
import request from "supertest";
import * as bcrypt from "bcrypt";

describe("Assignment (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let subjectId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const hashedPassword = await bcrypt.hash("12345678", 10);

    await prisma.user.upsert({
      where: { email: "admin@test.com" },
      update: { role: "ADMIN", password: hashedPassword },
      create: {
        email: "admin@test.com",
        password: hashedPassword,
        name: "Admin",
        role: "ADMIN",
      },
    });

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "admin@test.com",
        password: "12345678",
      });

    expect([200, 201]).toContain(login.status);
    expect(login.body.accessToken).toBeDefined();
    adminToken = login.body.accessToken;

    const subjectName = `Test Subject ${Date.now()}`;
    const subjectRes = await request(app.getHttpServer())
      .post("/subject/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: subjectName });

    subjectId = subjectRes.body.id ?? subjectRes.body.data?.id;
    expect(subjectId).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /assignment/create - должно создать задание с subjectId", async () => {
    const res = await request(app.getHttpServer())
      .post("/assignment/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test assignment",
        dueDay: "2026-03-20",
        priority: "MEDIUM",
        subjectId,
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test assignment");
    expect(res.body.subjectId).toBe(subjectId);
  });
});