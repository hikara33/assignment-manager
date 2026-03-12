import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly SMTP_HOST: string;
  private readonly SMTP_USER: string;
  private readonly SMTP_PASS: string;
  private readonly FROM: string;

  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.SMTP_HOST = configService.getOrThrow<string>("SMTP_HOST");
    this.SMTP_USER = configService.getOrThrow<string>("SMTP_USER");
    this.SMTP_PASS = configService.getOrThrow<string>("SMTP_PASS");

    this.FROM = `"Assignment Manager" <${this.SMTP_USER}>`;

    this.transporter = nodemailer.createTransport({
      host: this.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: this.SMTP_USER,
        pass: this.SMTP_PASS,
      },
    });
  }

  async sendGroupInvite(email: string, token: string) {
    const link = `http://localhost:3000/invite/accept?token=${token}`;

    await this.transporter.sendMail({
      from: this.FROM,
      to: email,
      subject: "You are invited to join a group",
      html: `
        <h2>Group Invitation</h2>
        <p>You have been invited to join a group.</p>
        <a href="${link}">Accept Invite</a>
        <p>This link expires in 24 hours.</p>
      `
    });

    this.logger.log(`Sent reminder to ${email}`);
  }

  async sendAssignmentReminder(email: string, taskTitle: string, dueDay: Date) {
    await this.transporter.sendMail({
      from: this.FROM,
      to: email,
      subject: "Assignment deadline reminder",
      html: `
        <h2>Reminder</h2>
        <p>Your assignment <b>${taskTitle}</b> is due soon.</p>
        <p>Deadline: ${dueDay.toDateString()}</p>
      `
    });

    this.logger.log(`Sent reminder to ${email}`);
  }
}
