import { ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";
import * as nodemailer from "nodemailer";

jest.mock("nodemailer");

describe("EmailService", () => {
  let service: EmailService;
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    sendMailMock = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const mockConfig = {
      getOrThrow: jest.fn((key: string) => {
        const config = {
          SMTP_HOST: "smtp.test.com",
          SMTP_USER: "test@gmail.com",
          SMTP_PASS: "password"
        };
        return config[key];
      })
    } as unknown as ConfigService;

    service = new EmailService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  
  it("should send group invite email", async () => {
    await service.sendGroupInvite("user@test.com", "refresh-token");
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const args = sendMailMock.mock.calls[0][0];

    expect(args.to).toBe("user@test.com");
    expect(args.subject).toBe("You are invited to join a group");
    expect(args.html).toContain("refresh-token");
  });

  it("should include invite link in email", async () => {
    await service.sendGroupInvite("user@test.com", "abc123");

    const args = sendMailMock.mock.calls[0][0];
    expect(args.html).toContain(
      'http://localhost:3000/invite/accept?token=abc123'
    );
  });

  it("should send assignment reminder email", async () => {
    const now = new Date("2026-03-20");

    await service.sendAssignmentReminder(
      "student@test.com",
      "Math Homework",
      now
    );
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const args = sendMailMock.mock.calls[0][0];

    expect(args.to).toBe("student@test.com");
    expect(args.subject).toBe("Assignment deadline reminder");
    expect(args.html).toContain("Math Homework");
  });

  it("should include deadline date in reminder email", async () => {
    const now = new Date("2026-03-20");

    await service.sendAssignmentReminder(
      "student@test.com",
      "Physics Lab",
      now
    );

    const args = sendMailMock.mock.calls[0][0];
    expect(args.html).toContain(now.toDateString());
  });
});