import KeyvRedis from '@keyv/redis';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import Redis from 'ioredis';
import { DbConfigService } from 'src/config/services/db.config.service';
import {
    CACHE_REDIS_STORE,
    QUEUE_REDIS_CONNECTION,
    THROTTLER_REDIS_CONNECTION,
} from './constants/redis.connections';
import { RedisHealthIndicator } from './health/redis.health';
import { logRedisClientError } from 'src/common/redis/log-redis.client-error';

/**
 * Provides and exports redis stores for EXTERNAL library modules like cache, throttler and queues.
 * This is done in order to create a health indicator for all the redis connections.
 *
 * App modules like sessions or tokens export their own redis connections in their respective modules.
 */

@Module({
    imports: [TerminusModule],
    providers: [
        {
            provide: CACHE_REDIS_STORE,
            useFactory: (db: DbConfigService) => {
                const redis = new KeyvRedis(db.redisCacheUri);
                redis.on('error', (err: string) => logRedisClientError(err, 'Cache'));
                return redis;
            },
            inject: [DbConfigService],
        },
        {
            provide: THROTTLER_REDIS_CONNECTION,
            useFactory: (db: DbConfigService) => {
                const redis = new Redis(db.redisAuthUri);
                redis.on('error', (err) => logRedisClientError(err, 'Throttler'));
                return redis;
            },
            inject: [DbConfigService],
        },
        {
            provide: QUEUE_REDIS_CONNECTION,
            useFactory: (db: DbConfigService) => {
                const redis = new Redis(db.redisQueuesUri, { maxRetriesPerRequest: null });
                redis.on('error', (err) => logRedisClientError(err, 'Queues'));
                return redis;
            },
            inject: [DbConfigService],
        },
        RedisHealthIndicator,
    ],
    exports: [
        CACHE_REDIS_STORE,
        THROTTLER_REDIS_CONNECTION,
        QUEUE_REDIS_CONNECTION,
        RedisHealthIndicator,
    ],
})
export class RedisMonitoringModule {}
