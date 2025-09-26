import { ISessionsModuleOptions } from 'src/sessions/interface/sessions-module-options.interface';
import { REDIS_TOKENS_CLIENT } from './constants/redis-tokens-client.token.constant';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { TokensService } from './tokens.service';
import {
    ConfigurableModuleAsyncOptions,
    DynamicModule,
    Global,
    Module,
} from '@nestjs/common';
import { ITokensModuleOptions } from './interfaces/tokens-module-options.interface';

@Global()
@Module({})
export class TokensModule {
    static forRootAsync(
        options: ConfigurableModuleAsyncOptions<ITokensModuleOptions>,
    ): DynamicModule {
        if (options.useFactory) {
            return {
                module: TokensModule,
                imports: [...(options.imports ?? [])],
                providers: [
                    {
                        provide: 'TOKENS_MODULE_OPTIONS',
                        useFactory: options.useFactory,
                        inject: options.inject,
                    },
                    {
                        provide: REDIS_TOKENS_CLIENT,
                        useFactory: async (opts: ISessionsModuleOptions) => {
                            const redisAdapter = new RedisAdapter({
                                uri: opts.redisUri,
                            });
                            await redisAdapter.connection.connect();
                            return redisAdapter;
                        },
                        inject: ['TOKENS_MODULE_OPTIONS'],
                    },
                    TokensService,
                ],
                exports: [TokensService],
            };
        } else {
            throw new Error('This module must be configured by "useFactory"');
        }
    }
}
