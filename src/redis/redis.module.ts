import { IRedisOptions } from './interface/redis.options.interface';
import { REDIS_AUTH } from './constants/redis.constants';
import { RedisService } from './redis.service';
import { createClient } from '@redis/client';
import { ModuleRef } from '@nestjs/core';
import {
    ConfigurableModuleAsyncOptions,
    DynamicModule,
    Global,
    Module,
    OnApplicationShutdown,
} from '@nestjs/common';

@Global()
@Module({})
export class RedisModule implements OnApplicationShutdown {
    private static readonly optionsProviderToken = 'REDIS_MODULE_OPTIONS';

    constructor(private moduleRef: ModuleRef) {}

    async onApplicationShutdown() {
        const redisAuth = this.moduleRef.get<RedisService>(REDIS_AUTH);
        await Promise.all([redisAuth.connection.disconnect()]);
    }

    private static provideRedisForAuth() {
        return {
            provide: REDIS_AUTH,
            inject: [this.optionsProviderToken],
            useFactory: async (
                options: IRedisOptions,
            ): Promise<RedisService> => {
                const client = createClient({
                    url: options.redisAuth,
                });
                const redisService = new RedisService(client);
                await redisService.connection.connect();
                await client.configSet('notify-keyspace-events', 'ExgK');
                return redisService;
            },
        };
    }

    static forRootAsync(
        options: ConfigurableModuleAsyncOptions<IRedisOptions>,
    ): DynamicModule {
        if (!options.useFactory)
            throw new Error('RedisModule requires useFactory option');

        return {
            module: RedisModule,
            imports: [...(options.imports || [])],
            providers: [
                {
                    provide: this.optionsProviderToken,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                this.provideRedisForAuth(),
            ],
            exports: [REDIS_AUTH],
        };
    }
}
