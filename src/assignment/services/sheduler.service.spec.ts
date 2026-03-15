import { SchedulerService } from "./sheduler.service";

describe("SchedulerService", () => {
  let service: SchedulerService;

  beforeEach(() => {
    service = new SchedulerService();
  });

  it("should suggest reschedule when more than 3 tasks", () => {
    const date = new Date("2026-03-20");

    const tasks = [
      { id: 1, title: "A", dueDay: date },
      { id: 2, title: "B", dueDay: date },
      { id: 3, title: "C", dueDay: date },
      { id: 4, title: "D", dueDay: date },
      { id: 5, title: "E", dueDay: date },
    ] as any;

    const result = service.suggestReschedule(tasks);

    expect(result.length).toBe(2);

    expect(result[0].taskTitle).toBe("D");
    expect(result[1].taskTitle).toBe("E");
    
    expect(result[0].to).toEqual(new Date("2026-03-21"));
    expect(result[1].to).toEqual(new Date("2026-03-22"));

    console.log(result);
  });

  it("should not suggest reschedule when to tasks", () => {
    const result = service.suggestReschedule([]);
    expect(result).toEqual([]);
  });

  it("should not suggest reschedule for 3 tasks", () => {
    const date = new Date("2026-03-20");

    const tasks = [
      { id: 1, title: "A", dueDay: date },
      { id: 2, title: "B", dueDay: date },
      { id: 3, title: "C", dueDay: date }
    ] as any;

    const result = service.suggestReschedule(tasks);
    expect(result.length).toBe(0);
  });

  it("should handle multiple overloaded days", () => {
    const tasks = [
      { id: 1, title: "A", dueDay: new Date("2026-03-20") },
      { id: 2, title: "B", dueDay: new Date("2026-03-20") },
      { id: 3, title: "C", dueDay: new Date("2026-03-20") },
      { id: 4, title: "D", dueDay: new Date("2026-03-20") },

      { id: 5, title: "E", dueDay: new Date("2026-03-21") },
      { id: 6, title: "F", dueDay: new Date("2026-03-21") },
      { id: 7, title: "G", dueDay: new Date("2026-03-21") },
      { id: 8, title: "H", dueDay: new Date("2026-03-21") }
    ] as any;

    const result = service.suggestReschedule(tasks);
    expect(result.length).toBe(2);

    expect(result[0].taskTitle).toBe("D");
    expect(result[1].taskTitle).toBe("H");
  });

  it("should still work with unsorted tasks", () => {
    const date = new Date("2026-03-20");

    const tasks = [
      { id: 5, title: "E", dueDay: date },
      { id: 1, title: "A", dueDay: date },
      { id: 3, title: "C", dueDay: date },
      { id: 2, title: "B", dueDay: date },
      { id: 4, title: "D", dueDay: date }
    ] as any;

    const result = service.suggestReschedule(tasks);

    expect(result.length).toBe(2);
    expect(result.map(r => r.taskTitle).sort()).toEqual(["B", "D"]);
  });

  
});