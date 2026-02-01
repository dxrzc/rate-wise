import KeyvRedis, { RedisClientOptions } from '@keyv/redis';
import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
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
import { redisReconnectStrategy } from 'src/common/functions/redis/redis-reconnect-strategy';
import { runSettledOrThrow } from 'src/common/functions/utils/run-settled-or-throw.util';

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
            /**
             * Fails fast but silently.
             * Redis client is replaced on fatal socket errors. See "uncaughtException" listener
             */
            provide: CACHE_REDIS_STORE,
            useFactory: (db: DbConfigService) => {
                const clientOptions: RedisClientOptions = {
                    url: db.redisCacheUri,
                    socket: { reconnectStrategy: redisReconnectStrategy },
                    disableOfflineQueue: true,
                };
                const keyvRedis = new KeyvRedis(clientOptions);
                keyvRedis.on('error', (err: string) => logRedisClientError(err, 'Cache'));
                return keyvRedis;
            },
            inject: [DbConfigService],
        },
        {
            /**
             * Fails fast.
             */
            provide: THROTTLER_REDIS_CONNECTION,
            useFactory: (db: DbConfigService) => {
                const redis = new Redis(db.redisAuthUri, {
                    retryStrategy: redisReconnectStrategy,
                    enableOfflineQueue: false,
                    maxRetriesPerRequest: 0,
                });
                redis.on('error', (err) => logRedisClientError(err, 'Throttler'));
                return redis;
            },
            inject: [DbConfigService],
        },
        {
            /**
             * When redis is down, this connection is will retry indefinitely
             * until redis is available again.
             */
            provide: QUEUE_REDIS_CONNECTION,
            useFactory: (db: DbConfigService) => {
                const redis = new Redis(db.redisQueuesUri, {
                    maxRetriesPerRequest: null,
                    retryStrategy: redisReconnectStrategy,
                });
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
export class RedisMonitoringModule implements OnModuleDestroy {
    constructor(
        @Inject(CACHE_REDIS_STORE) private readonly cacheRedisStore: KeyvRedis<string>,
        @Inject(THROTTLER_REDIS_CONNECTION) private readonly throttlerRedis: Redis,
        @Inject(QUEUE_REDIS_CONNECTION) private readonly queueRedis: Redis,
    ) {}

    async onModuleDestroy() {
        await runSettledOrThrow([
            this.cacheRedisStore.disconnect(),
            this.throttlerRedis.quit(),
            this.queueRedis.quit(),
        ]);
    }
}
