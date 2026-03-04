import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly SMTP_HOST: string;
  private readonly SMTP_USER: string;
  private readonly SMTP_PASS: string;

  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.SMTP_HOST = configService.getOrThrow<string>("SMTP_HOST");
    this.SMTP_USER = configService.getOrThrow<string>("SMTP_USER");
    this.SMTP_PASS = configService.getOrThrow<string>("SMTP_PASS");

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
      from: `"Assignment Manager" <${this.SMTP_USER}>`,
      to: email,
      subject: "You are invited to join a group",
      html: `
        <h2>Group Invitation</h2>
        <p>You have been invited to join a group.</p>
        <a href="${link}">Accept Invite</a>
        <p>This link expires in 24 hours.</p>
      `
    });
  }
}
