import { REDIS_SESSIONS_CLIENT } from './constants/redis-sessions-client.constant';
import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(REDIS_SESSIONS_CLIENT)
        private readonly redisClient: RedisClientType,
    ) {}
}
