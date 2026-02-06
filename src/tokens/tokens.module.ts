import { DynamicModule, Module, OnApplicationShutdown } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { RedisConnection } from 'src/common/redis/redis.connection';
import {
    FactoryConfigModule,
    FactoryConfigModuleWithCustomToken,
} from 'src/common/types/factory-config.module.type';
import {
    TOKENS_FEATURE_OPTIONS,
    TOKENS_REDIS_CONNECTION,
    TOKENS_ROOT_OPTIONS,
} from './di/tokens.providers';
import { ITokensFeatureOptions } from './config/tokens-feature.options';
import { ITokensRootOptions } from './config/tokens-root.options';
import { TokensService } from './tokens.service';

@Module({})
export class TokensModule implements OnApplicationShutdown {
    private static redisConnection: RedisConnection;

    async onApplicationShutdown() {
        await TokensModule.redisConnection.disconnect();
    }

    static forRootAsync(options: FactoryConfigModule<ITokensRootOptions>): DynamicModule {
        return {
            module: TokensModule,
            global: true,
            imports: options.imports || [],
            providers: [
                {
                    provide: TOKENS_ROOT_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                {
                    provide: TOKENS_REDIS_CONNECTION,
                    useFactory: async (moduleOpts: ITokensRootOptions) => {
                        const redisClient = new RedisClientAdapter({
                            redisUri: moduleOpts.connection.redisUri,
                            context: TokensModule.name,
                            disableOfflineQueue: true,
                        });
                        TokensModule.redisConnection = redisClient.connection;
                        await redisClient.connection.connect();
                        return redisClient;
                    },
                    inject: [TOKENS_ROOT_OPTIONS],
                },
            ],
            exports: [TOKENS_REDIS_CONNECTION],
        };
    }

    static forFeatureAsync(
        options: FactoryConfigModuleWithCustomToken<ITokensFeatureOptions>,
    ): DynamicModule {
        const moduleOptionsProvider = {
            provide: TOKENS_FEATURE_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject,
        };

        return {
            module: TokensModule,
            imports: [
                ...(options.imports || []),
                JwtModule.registerAsync({
                    extraProviders: [moduleOptionsProvider],
                    inject: [TOKENS_FEATURE_OPTIONS],
                    useFactory: (tokenOpts: ITokensFeatureOptions) => ({
                        secret: tokenOpts.secret,
                        signOptions: { expiresIn: tokenOpts.expiresIn },
                    }),
                }),
            ],
            providers: [
                TokensService,
                moduleOptionsProvider,
                {
                    provide: options.provide,
                    useExisting: TokensService,
                },
            ],
            exports: [TokensService, options.provide],
        };
    }
}
