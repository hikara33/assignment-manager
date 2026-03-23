import { PrismaService } from 'src/prisma/prisma.service';
import { AutomationService } from './automation.service';
import { EmailService } from 'src/group/email/email.service';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      assignment: { updateMany: jest.fn(), findMany: jest.fn() },
      refreshToken: { deleteMany: jest.fn() },
      groupInvite: { updateMany: jest.fn() },
      user: { findMany: jest.fn() },
    })),
  };
});

describe('AutomationService (cron)', () => {
  let service: AutomationService;
  let prisma: PrismaService;
  let email: EmailService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        PrismaService,
        {
          provide: EmailService,
          useValue: { sendAssignmentReminder: jest.fn() },
        },
      ],
    }).compile();

    moduleRef = module;
    service = module.get<AutomationService>(AutomationService);
    prisma = module.get<PrismaService>(PrismaService);
    email = module.get<EmailService>(EmailService);
  });

  afterEach(async () => {
    await moduleRef?.close?.();
  });

  it('should mark overdue assignments', async () => {
    (prisma.assignment.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

    await service.markOverdueAssignments();

    expect(prisma.assignment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: 'COMPLETED' } }),
        data: { status: 'OVERDUE' },
      }),
    );
  });

  it('should send reminders for assignments due in 3 days', async () => {
    const mockTasks = [
      { title: 'Task 1', dueDay: new Date(), user: { email: 'test@test.com' } },
    ];
    (prisma.assignment.findMany as jest.Mock).mockResolvedValue(mockTasks);

    await service.sendDeadlineReminders();

    expect(prisma.assignment.findMany).toHaveBeenCalled();
    expect(email.sendAssignmentReminder).toHaveBeenCalledWith(
      'test@test.com',
      'Task 1',
      mockTasks[0].dueDay,
    );
  });

  it('should clean expired tokens and update invites', async () => {
    (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
      count: 3,
    });
    (prisma.groupInvite.updateMany as jest.Mock).mockResolvedValue({
      count: 5,
    });

    await service.cleanExpiredTokensAndInvites();

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    expect(prisma.groupInvite.updateMany).toHaveBeenCalled();
  });
});
