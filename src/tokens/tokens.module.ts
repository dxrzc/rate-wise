import { FactoryConfigModuleWithCustomToken } from 'src/common/types/modules/factory-config.module.type';
import { ITokensOptions } from './interfaces/tokens.options.interface';
import {
    TOKENS_OPTIONS,
    TOKENS_REDIS_CONNECTION,
} from './constants/tokens.constants';
import { DynamicModule, Module, OnApplicationShutdown } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtModule } from '@nestjs/jwt';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { RedisConnection } from 'src/common/redis/redis.connection';

@Module({})
export class TokensModule implements OnApplicationShutdown {
    private static redisConnection: RedisConnection;

    async onApplicationShutdown() {
        await TokensModule.redisConnection.disconnect();
    }

    static forFeatureAsync(
        options: FactoryConfigModuleWithCustomToken<ITokensOptions>,
    ): DynamicModule {
        const moduleOptionsProvider = {
            provide: TOKENS_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject,
        };

        return {
            module: TokensModule,
            imports: [
                ...(options.imports || []),
                JwtModule.registerAsync({
                    extraProviders: [moduleOptionsProvider],
                    inject: [TOKENS_OPTIONS],
                    useFactory: (tokenOpts: ITokensOptions) => ({
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
                {
                    provide: TOKENS_REDIS_CONNECTION,
                    useFactory: async (moduleOpts: ITokensOptions) => {
                        const redisUri = moduleOpts.connection.redisUri;
                        const redisClient = new RedisClientAdapter(
                            redisUri,
                            'Tokens',
                        );
                        TokensModule.redisConnection = redisClient.connection;
                        await redisClient.connection.connect();
                        return redisClient;
                    },
                    inject: [TOKENS_OPTIONS],
                },
            ],
            exports: [TokensService, options.provide],
        };
    }
}
