import { ConflictDetectorService } from "./conflict-detector.service"

describe("ConflictDetectorService", () => {
  let service: ConflictDetectorService;

  beforeEach(() => {
    service = new ConflictDetectorService();
  });

  it("should detect conflict for 3 tasks on same date", () => {
    const date = new Date("2026-03-20");

    const tasks = [
      { id: 1, title: "A", dueDay: date },
      { id: 2, title: "B", dueDay: date },
      { id: 3, title: "C", dueDay: date },
    ] as any;

    const result = service.detect(tasks);

    expect(result.length).toBe(1);
    expect(result[0].count).toBe(3);
  });

  it("should not detect conflict for different dates", () => {
    const tasks = [
      { id: 1, title: "A", dueDay: new Date("2026-03-20") },
      { id: 2, title: "B", dueDay: new Date("2026-03-21") },
      { id: 3, title: "C", dueDay: new Date("2026-03-22") },
    ] as any;

    const result = service.detect(tasks);

    expect(result.length).toBe(0);
  });

  it("should not detect conflict for 2 tasks on same date", () => {
    const date = new Date("2026-03-20");

    const tasks = [
      { id: 1, title: "A", dueDay: date },
      { id: 2, title: "B", dueDay: date }
    ] as any;

    const result = service.detect(tasks);

    expect(result.length).toBe(0);
  });

  it("should detect multiple conflicts", () => {
    const oneDate = new Date("2026-03-20");
    const secDate = new Date("2026-03-21");

    const tasks = [
      { id: 1, title: "A", dueDay: oneDate },
      { id: 2, title: "B", dueDay: oneDate },
      { id: 3, title: "C", dueDay: oneDate },

      { id: 4, title: "D", dueDay: secDate },
      { id: 5, title: "E", dueDay: secDate },
      { id: 6, title: "F", dueDay: secDate },
    ] as any;

    const result = service.detect(tasks);

    expect(result.length).toBe(2);
  });
});