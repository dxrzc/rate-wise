import { REDIS_SESSIONS_TOKEN } from './constants/redis-sessions-token.constant';
import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(REDIS_SESSIONS_TOKEN)
        private readonly redisClient: RedisClientType,
    ) {}
}
