import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class BruteForceService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_SECONDS = 60;
  private readonly BLOCK_TIME_SECONDS = 15 * 60;

  constructor(private readonly redisService: RedisService) {}

  async checkBlocked(ip: string, email: string): Promise<void> {
    const redis = this.redisService.getClient();

    const [ipBlocked, emailBlocked] = await Promise.all([
      redis.exists(this.getIpBlockKey(ip)),
      redis.exists(this.getEmailBlockKey(email)),
    ]);

    if (ipBlocked || emailBlocked) {
      throw new HttpException(
        'Слишком много попыток входа. Попробуйте позже',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerFailedAttempt(ip: string, email: string): Promise<void> {
    const redis = this.redisService.getClient();

    const ipKey = this.getIpFailKey(ip);
    const emailKey = this.getEmailFailKey(email);

    const [ipAttempts, emailAttempts] = await Promise.all([
      redis.incr(ipKey),
      redis.incr(emailKey),
    ]);

    const pipline = redis.multi();

    if (ipAttempts === 1) pipline.expire(ipKey, this.WINDOW_SECONDS);
    if (emailAttempts === 1) pipline.expire(emailKey, this.WINDOW_SECONDS);

    if (ipAttempts >= this.MAX_ATTEMPTS) {
      pipline.set(this.getIpBlockKey(ip), '1', 'EX', this.BLOCK_TIME_SECONDS);
      pipline.del(ipKey);
    }

    if (emailAttempts >= this.MAX_ATTEMPTS) {
      pipline.set(
        this.getEmailBlockKey(email),
        '1',
        'EX',
        this.BLOCK_TIME_SECONDS,
      );
      pipline.del(emailKey);
    }

    await pipline.exec();
  }

  async clearAttempts(ip: string, email: string): Promise<void> {
    const redis = this.redisService.getClient();
    await redis.del(this.getIpFailKey(ip), this.getEmailFailKey(email));
  }

  private getIpFailKey(ip: string) {
    return `auth:failed:${ip}`;
  }

  private getIpBlockKey(ip: string) {
    return `auth:blocked:${ip}`;
  }

  private getEmailFailKey(email: string) {
    return `auth:failed:${email}`;
  }

  private getEmailBlockKey(email: string) {
    return `auth:blocked:${email}`;
  }
}
