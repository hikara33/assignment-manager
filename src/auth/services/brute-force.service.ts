import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class BruteForceService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_SECONDS = 60;
  private readonly BLOCK_TIME_SECONDS = 15 * 60;

  constructor(private readonly redisService: RedisService) {}

  async checkBlocked(ip: string): Promise<void> {
    const redis = this.redisService.getClient();

    const blocked = await redis.exists(`auth:blocked:${ip}`);

    if (blocked) {
      throw new HttpException(
        'Слишком много попыток входа. Попробуйте позже',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerFailedAttempts(ip: string): Promise<void> {
    const redis = this.redisService.getClient();

    const key = `auth:failed:${ip}`;
    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, this.WINDOW_SECONDS);
    }

    if (attempts >= this.MAX_ATTEMPTS) {
      await redis.set(`auth:blocked:${ip}`, '1', 'EX', this.BLOCK_TIME_SECONDS);
      await redis.del(key);
    }
  }

  async clearAttempts(ip: string): Promise<void> {
    const redis = this.redisService.getClient();
    await redis.del(`auth:failed:${ip}`);
  }
}
