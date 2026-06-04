import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CacheService {
  private readonly VERSION_TTL = 60 * 60 * 24;

  constructor(private readonly redisService: RedisService) {}

  private get redis() {
    return this.redisService.getClient();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (!value) return null;

    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async getVersionKey(userId: string): Promise<number> {
    const v = await this.redis.get(this.versionKey(userId));
    return v ? Number(v) : 1;
  }

  async bumpUserVersion(userId: string) {
    const key = this.versionKey(userId);

    await this.redis.incr(key);
    await this.redis.expire(key, this.VERSION_TTL);
  }

  private versionKey(userId: string) {
    return `cache:user:v:${userId}`;
  }
}
