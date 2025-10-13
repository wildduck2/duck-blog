import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type RedisClientType } from 'redis'

@Injectable()
export class RedisService {
  constructor(private readonly config: ConfigService) {
    this.connectToRedis()
  }

  public async connectToRedis(): Promise<RedisClientType> {
    const redisClient = createClient({
      url: this.config.get<string>('REDIS_URL'),
    })
    redisClient.connect()
    console.log('✅ Redis connected')
    // @ts-expect-error
    return redisClient
  }
}
