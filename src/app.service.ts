import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(private readonly redisService: RedisService) {}

  async getHello(): Promise<string> {
    const redis = this.redisService.getClient();

    await redis.set('test', 'hello world');
    const test = await redis.get('test');
    console.log(test);

    return 'Hello World!';
  }
}
