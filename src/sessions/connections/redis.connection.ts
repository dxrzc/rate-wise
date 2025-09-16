import { REDIS_SESSIONS_TOKEN } from '../constants/redis-sessions-token.constant';
import { RedisClientType } from '@redis/client';
import {
    BeforeApplicationShutdown,
    Inject,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class RedisSessionsConnectionManager
    implements OnModuleInit, BeforeApplicationShutdown
{
    constructor(
        @Inject(REDIS_SESSIONS_TOKEN)
        private readonly redisClient: RedisClientType,
    ) {}

    async onModuleInit() {
        console.log('Connecting to redis');
        await this.redisClient.connect();
    }

    async beforeApplicationShutdown() {
        await this.redisClient.quit();
    }
}
