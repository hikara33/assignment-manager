import { Assignment } from "src/generated/prisma/client";
import { PriorityResolverService } from "./priority-resolver.service";
import { PrismaService } from "src/prisma/prisma.service";

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    assignment: {
      findMany: jest.fn()
    }
  }))
}));

describe("PriorityResolverService", () => {
  let service: PriorityResolverService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      assignment: {
        findMany: jest.fn()
      }
    };

    service = new PriorityResolverService(mockPrisma);
  });

  it("calculateScore: higher priority should have higher score", () => {
    const now = new Date();
    const low = {
      priority: 'LOW',
      dueDay: new Date(now.getTime() + 5*24*60*60*1000),
      status: "PENDING"
    } as Assignment;
    const high = {
      priority: "HIGH",
      dueDay: new Date(now.getTime() + 5*24*60*60*1000),
      status: "PENDING"
    } as Assignment;

    expect(service.calculateScore(high)).toBeGreaterThan(service.calculateScore(low));
  });

  it("calculateScore: overdue tasks get extra points", () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const overdueTask = {
      priority: "MEDIUM",
      dueDay: new Date(past.getTime() + 5*24*60*60*1000),
      status: "OVERDUE"
    } as Assignment;

    const score = service.calculateScore(overdueTask);
    expect(score).toBeGreaterThan(20);
  });

  it("calculateScore: completed overdue tasks do not get overdue bonus", () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const completedTask = {
      priority: "HIGH",
      dueDay: new Date(past.getTime() + 5*24*60*60*1000),
      status: "COMPLETED"
    } as Assignment;

    const score = service.calculateScore(completedTask);
    expect(score).toBeLessThan(50);
  });

  it("calculateScore: tasks closer to deadline have higher score", () => {
    const now = new Date();
    const near = {
      priority: "MEDIUM",
      dueDay: new Date(now.getTime() + 1*24*60*60*1000),
      status: "PENDING"
    } as Assignment;
    const far = {
      priority: "MEDIUM",
      dueDay: new Date(now.getTime() + 10*24*60*60*1000),
      status: "PENDING"
    } as Assignment;

    expect(service.calculateScore(near)).toBeGreaterThan(service.calculateScore(far));
  });

  it("getPrioritizedAssignments: returns tasks sorted by score", async () => {
    const now = new Date();

    const tasks: Assignment[] = [
      { id: 1, priority: "LOW", dueDay: new Date(now.getTime() + 5*24*60*60*1000), status: "PENDING"} as any,
      { id: 2, priority: "HIGH", dueDay: new Date(now.getTime() + 5*24*60*60*1000), status: "PENDING"} as any,
      { id: 3, priority: "MEDIUM", dueDay: new Date(now.getTime() + 2*24*60*60*1000), status: "PENDING"} as any
    ];

    mockPrisma.assignment.findMany.mockResolvedValue(tasks);
    const result = await service.getPrioritizedAssignments('user-1');

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThan(result[i + 1].score);
    }

    expect(result.map(r => r.id)).toEqual([2, 3, 1]);
  });
});