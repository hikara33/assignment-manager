import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendGroupInvite(email: string, token: string) {}
}
