import { PrismaService } from "src/prisma/prisma.service";
import { AssignmentService } from "./assignment.service";
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { ConflictDetectorService } from "./services/conflict-detector.service";
import { WorkloadService } from "./services/workload.service";
import { SchedulerService } from "./services/sheduler.service";

describe("AssignmentService (Integration)", () => {
  let service: AssignmentService;
  let prisma: PrismaService;
  let moduleRef: any;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ".env.test" })
      ],
      providers: [
        AssignmentService,
        PrismaService,
        ConflictDetectorService,
        WorkloadService,
        SchedulerService
      ]
    }).compile();

    moduleRef = module;
    service = module.get<AssignmentService>(AssignmentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.assignment.deleteMany();
    await prisma.user.deleteMany();
    await prisma.subject.deleteMany();
  });
  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef?.close?.();
  });

  it("should create an assignment in the test DB", async () => {
    const user = await prisma.user.create({
      data: { email: "student@test.com", name: "Test User", password: "testpassword" }
    });

    const subject = await prisma.subject.create({
      data: {
        name: "Test Subject",
        description: "Subject for integration test"
      }
    });

    const now = new Date();
    const assignment = await service.create(user.id, {
      title: "Test Task",
      dueDay: now.toISOString(),
      subjectId: subject.id,
      priority: "MEDIUM",
    });

    const fromBd = await prisma.assignment.findUnique({
      where: { id: assignment.id }
    });

    expect(fromBd).toBeDefined();
    expect(fromBd?.title).toBe("Test Task");
  });

  it("should update assignment status", async  () => {
    const user = await prisma.user.create({
      data: { email: "student2@test.com", name: "Another User", password: "password" }
    });

    const subject = await prisma.subject.create({
      data: {
        name: "Test Subject2",
        description: "Subject for integration test 2"
      }
    });

    const assignment = await prisma.assignment.create({
      data: {
        title: "Old Task",
        dueDay: new Date(),
        userId: user.id,
        subjectId: subject.id,
        priority: "LOW",
        status: "PENDING"
      }
    });

    const updated = await service.updateStatus(assignment.id, "COMPLETED", user.id);
    expect(updated.status).toBe("COMPLETED");

    const fromBd = await prisma.assignment.findUnique({
      where: { id: assignment.id }
    });
    expect(fromBd?.status).toBe("COMPLETED");
  });
});