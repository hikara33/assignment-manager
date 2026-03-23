import { PrismaService } from 'src/prisma/prisma.service';
import { GroupService } from './group.service';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

describe('GroupInvite (Integration)', () => {
  let service: GroupService;
  let prisma: PrismaService;
  let moduleRef: any;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ envFilePath: '.env.test' })],
      providers: [GroupService, PrismaService],
    }).compile();

    moduleRef = module;
    service = module.get<GroupService>(GroupService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.assignment.deleteMany();
    await prisma.userGroup.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  });
  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef?.close?.();
  });

  it('should create group', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        name: 'Owner User',
        password: 'ownerpassword',
      },
    });

    const group = await service.createGroup(user.id, 'Test Group');
    expect(group.name).toBe('Test Group');

    const userInGroup = await prisma.userGroup.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
    expect(userInGroup?.role).toBe('OWNER');
  });
});
