/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */

import { DbConfigService } from 'src/config/services/db.config.service';
import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { REDIS_AUTH } from './constants/redis.constants';
import { RedisService } from './redis.service';
import { createClient } from '@redis/client';
import { ModuleRef } from '@nestjs/core';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_AUTH,
            inject: [DbConfigService],
            useFactory: async (
                dbConfig: DbConfigService,
            ): Promise<RedisService> => {
                const client = createClient({
                    url: dbConfig.redisAuthUri,
                });
                const redisService = new RedisService(client);
                await redisService.connection.connect();
                await client.configSet('notify-keyspace-events', 'ExgK');
                return redisService;
            },
        },
    ],
    exports: [REDIS_AUTH],
})
export class RedisModule implements OnApplicationShutdown {
    constructor(private moduleRef: ModuleRef) {}

    async onApplicationShutdown() {
        const redisAuth = this.moduleRef.get<RedisService>(REDIS_AUTH);
        await Promise.all([redisAuth.connection.disconnect()]);
    }
}
