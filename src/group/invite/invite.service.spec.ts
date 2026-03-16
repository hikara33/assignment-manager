import { PrismaService } from "src/prisma/prisma.service";
import { InviteService } from "./invite.service";
import { Test } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailService } from "../email/email.service";
import { JwtService } from "@nestjs/jwt";
import { ConflictException } from "@nestjs/common";

jest.mock("nodemailer");

const jwtMock = {
  sign: jest.fn(),
  verifyAsync: jest.fn(),
};

describe("Invite Service (Integration)", () => {
  let service: InviteService;
  let prisma: PrismaService;
  let moduleRef: any;

  const sendMailMock = {
    sendGroupInvite: jest.fn()
  };

  beforeAll(async () => {
    jwtMock.sign.mockImplementation(() => "test-token");
    jwtMock.verifyAsync.mockReset();

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ".env.test" })
      ],
      providers: [
        InviteService,
        PrismaService,
        {
          provide: JwtService,
          useValue: jwtMock
        },
        {
          provide: EmailService,
          useValue: sendMailMock
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === "JWT_INVITE_TTL") return "1h";
              throw new Error(`Unknown config key: ${key}`);
            })
          }
        }
      ]
    }).compile();

    moduleRef = module;
    service = module.get<InviteService>(InviteService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.userGroup.deleteMany();
    await prisma.groupInvite.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(async () => {
    await prisma?.$disconnect();
    await moduleRef?.close?.();
  });

  it("should create invite if owner invites user", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner",
        password: "123",
      },
    });

    const group = await prisma.group.create({ data: { name: "Test Group" }});
    await prisma.userGroup.create({
      data: {
        userId: owner.id,
        groupId: group.id,
        role: "OWNER",
      },
    });

    await service.inviteUser("invite@test.com", group.id, owner.id);
    const invite = await prisma.groupInvite.findFirst({ where: { email: "invite@test.com" }});

    expect(invite).toBeDefined();
    expect(invite?.status).toBe("PENDING");

    expect(sendMailMock.sendGroupInvite).toHaveBeenCalled();
  });

  it("should throw if inviter is not owner", async () => {
    const user = await prisma.user.create({
      data: {
        email: "user@test.com",
        name: "User",
        password: "123",
      },
    });

    const group = await prisma.group.create({ data: { name: "Test Group" }});
    await prisma.userGroup.create({
      data: {
        userId: user.id,
        groupId: group.id,
        role: "MEMBER",
      },
    });

    await expect(
      service.inviteUser("user@test.com", group.id, user.id)
    ).rejects.toThrow(ConflictException);
  });

  it("should throw if invite already exists", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner",
        password: "123",
      },
    });

    const group = await prisma.group.create({ data: { name: "Test Group" }});
    await prisma.userGroup.create({
      data: {
        userId: owner.id,
        groupId: group.id,
        role: "OWNER",
      },
    });

    const token = service["generateToken"](
      "invite@test.com",
      group.id,
      owner.id,
    );

    await prisma.groupInvite.create({
      data: {
        email: "invite@test.com",
        token: service["hashToken"](token),
        groupId: group.id,
        invitedById: owner.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 100000),
      },
    });

    await expect(
      service.inviteUser(
        "invite@test.com",
        group.id,
        owner.id
      )
    ).rejects.toThrow(ConflictException);
  });

  //accept
  it("should accept invite", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner",
        password: "123",
      },
    });

    const invitedUser = await prisma.user.create({
      data: {
        email: "invite@test.com",
        name: "Invite",
        password: "123",
      },
    });

    const group = await prisma.group.create({ data: { name: "Test Group" }});
    await prisma.userGroup.create({
      data: {
        userId: owner.id,
        groupId: group.id,
        role: "OWNER",
      },
    });

    const token = service["generateToken"](
      invitedUser.email,
      group.id,
      owner.id
    );

    (jwtMock.verifyAsync as jest.Mock).mockResolvedValue({
      email: invitedUser.email,
      groupId: group.id,
      invitedById: owner.id,
      type: "GROUP_INVITE"
    });

    await prisma.groupInvite.create({
      data: {
        email: invitedUser.email,
        token: service["hashToken"](token),
        groupId: group.id,
        invitedById: owner.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 100000),
      },
    });

    await service.acceptInvite(token, invitedUser.id);

    const membership = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: { userId: invitedUser.id, groupId: group.id }
      }
    });
    expect(membership).toBeDefined();

    const invite = await prisma.groupInvite.findFirst({
      where: { email: invitedUser.email }
    });
    expect(invite?.status).toBe("ACCEPTED");
  });

  it("should not accept invite for another user", async () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner",
        password: "123",
      },
    });

    const invitedUser = await prisma.user.create({
      data: {
        email: "invite@test.com",
        name: "Invite",
        password: "123",
      },
    });

    const anotherUser = await prisma.user.create({
      data: {
        email: "another@test.com",
        name: "Another",
        password: "123",
      },
    });

    const group = await prisma.group.create({ data: { name: "Test Group" }});
    await prisma.userGroup.create({
      data: {
        userId: owner.id,
        groupId: group.id,
        role: "OWNER",
      },
    });

    const token = service["generateToken"](
      invitedUser.email,
      group.id,
      owner.id
    );

    await prisma.groupInvite.create({
      data: {
        email: invitedUser.email,
        token: service["hashToken"](token),
        groupId: group.id,
        invitedById: owner.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 100000),
      },
    });

    await expect(
      service.acceptInvite(token, anotherUser.id)
    ).rejects.toThrow();
  });


  //decline
  it("should decline invite", async  () => {
    const owner = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner",
        password: "123",
      },
    });

    const invitedUser = await prisma.user.create({
      data: {
        email: "invite@test.com",
        name: "Invite",
        password: "123",
      },
    });

    const group = await prisma.group.create({ data: { name: "Test Group" }});
    await prisma.userGroup.create({
      data: {
        userId: owner.id,
        groupId: group.id,
        role: "OWNER",
      },
    });

    const token = service["generateToken"](
      invitedUser.email,
      group.id,
      owner.id
    );

    await prisma.groupInvite.create({
      data: {
        email: invitedUser.email,
        token: service["hashToken"](token),
        groupId: group.id,
        invitedById: owner.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 100000),
      },
    });

    await service.declineInvite(token, invitedUser.id);
    
    const invite = await prisma.groupInvite.findFirst({
      where: { email: invitedUser.email }
    });
    expect(invite?.status).toBe("DECLINED");
  });
});