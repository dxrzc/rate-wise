import { REDIS_SESSIONS_CLIENT } from '../constants/redis-sessions-client.constant';
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
        @Inject(REDIS_SESSIONS_CLIENT)
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
