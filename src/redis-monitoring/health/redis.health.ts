import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { TOKENS_REDIS_CONNECTION } from 'src/tokens/constants/tokens.constants';
import {
    QUEUE_REDIS_CONNECTION,
    THROTTLER_REDIS_CONNECTION,
} from '../di/redis-monitoring.providers';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
    constructor(
        private readonly healthIndicatorService: HealthIndicatorService,
        @Inject(SESSIONS_REDIS_CONNECTION)
        private readonly redisSessions: RedisClientAdapter,
        @Inject(TOKENS_REDIS_CONNECTION)
        private readonly redisTokens: RedisClientAdapter,
        @Inject(THROTTLER_REDIS_CONNECTION)
        private readonly redisThrottler: Redis,
        @Inject(QUEUE_REDIS_CONNECTION)
        private readonly redisQueues: Redis,
    ) {}

    async isHealthy(key: string) {
        const indicator = this.healthIndicatorService.check(key);
        const results = {
            sessions: await this.checkClient(this.redisSessions),
            tokens: await this.checkClient(this.redisTokens),
            throttler: await this.checkClient(this.redisThrottler),
            queues: await this.checkClient(this.redisQueues),
        };
        const hasError = Object.values(results).some((r) => r.status === 'down');
        return hasError ? indicator.down(results) : indicator.up();
    }

    private async checkClient(client: RedisClientAdapter | Redis) {
        try {
            await this.withTimeout(client.ping(), 3000);
            return { status: 'up' };
        } catch (e) {
            return { status: 'down', message: String(e) };
        }
    }

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Health check timeout')), timeoutMs),
            ),
        ]);
    }
}
