import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import { IRedisOptions } from './interface/redis.options.interface';
import { REDIS_AUTH, REDIS_QUEUES } from './constants/redis.constants';
import { RedisService } from './redis.service';
import { createClient } from '@redis/client';
import { ModuleRef } from '@nestjs/core';
import {
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

    private static async createAndConnectClient(redisUri: string) {
        const client = createClient({
            url: redisUri,
        });
        const redisService = new RedisService(client);
        await redisService.connection.connect();
        return redisService;
    }

    private static provideRedisForAuth() {
        return {
            provide: REDIS_AUTH,
            inject: [this.optionsProviderToken],
            useFactory: async (opts: IRedisOptions): Promise<RedisService> => {
                return this.createAndConnectClient(opts.redisAuth);
            },
        };
    }

    private static provideRedisForQueues() {
        return {
            provide: REDIS_QUEUES,
            inject: [this.optionsProviderToken],
            useFactory: async (opts: IRedisOptions): Promise<RedisService> => {
                return this.createAndConnectClient(opts.redisQueues);
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
                this.provideRedisForQueues(),
            ],
            exports: [REDIS_AUTH],
        };
    }
}
