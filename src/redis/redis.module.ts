import {
    DynamicModule,
    Global,
    Module,
    OnApplicationShutdown,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { createClient } from '@redis/client';
import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import { REDIS_AUTH } from './constants/redis.constants';
import { RedisType } from './enum/redis-type.enum';
import { IRedisOptions } from './interface/redis.options.interface';
import { RedisService } from './redis.service';

/**
 * Provides injectable redis connections.
 * Do note this module should not be used at all in modules where
 * connection is handling by library like BullModule or CacheModule
 * unless you need to access the database using your own connection.
 */
@Global()
@Module({})
export class RedisModule implements OnApplicationShutdown {
    private static readonly optionsProviderToken = 'REDIS_MODULE_OPTIONS';

    constructor(private moduleRef: ModuleRef) {}

    async onApplicationShutdown() {
        const redisAuth = this.moduleRef.get<RedisService>(REDIS_AUTH);
        await Promise.all([redisAuth.connection.disconnect()]);
    }

    private static async createAndConnectClient(
        redisUri: string,
        type: RedisType,
    ) {
        const client = createClient({
            url: redisUri,
        });
        const redisService = new RedisService(client, type);
        await redisService.connection.connect();
        return redisService;
    }

    private static provideRedisForAuth() {
        return {
            provide: REDIS_AUTH,
            inject: [this.optionsProviderToken],
            useFactory: async (opts: IRedisOptions): Promise<RedisService> => {
                return this.createAndConnectClient(
                    opts.redisAuth,
                    RedisType.auth,
                );
            },
        };
    }

    static forRootAsync(
        options: FactoryConfigModule<IRedisOptions>,
    ): DynamicModule {
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
