import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/prisma/prisma.service";
import request from "supertest";
import * as bcrypt from "bcrypt";

describe("Invite (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let groupId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // --- Очистка данных перед тестом ---
    await prisma.assignment.deleteMany(); // добавить
    await prisma.groupInvite.deleteMany();
    await prisma.userGroup.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    // --- Создаём владельца группы ---
    const hashedPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.create({
      data: {
        email: "owner@test.com",
        password: hashedPassword,
        name: "Owner"
      },
    });

    // --- Логинимся ---
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "owner@test.com", password: "12345678" });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();
    ownerToken = login.body.accessToken;

    // --- Создаём группу ---
    const groupRes = await request(app.getHttpServer())
      .post("/group/create")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Test Group" });

    expect(groupRes.status).toBe(201);
    groupId = groupRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /group/:id/invite - должно создать приглашение", async () => {
    const res = await request(app.getHttpServer())
      .post(`/group/${groupId}/invite`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: "invite@test.com" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("invite@test.com");
    expect(res.body.status).toBe("PENDING");
  });

  it("POST /group/:id/invite - не может отправить повторное приглашение", async () => {
    // Отправляем повторно
    const res = await request(app.getHttpServer())
      .post(`/group/${groupId}/invite`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: "invite@test.com" });

    expect(res.status).toBe(409);
  });
});