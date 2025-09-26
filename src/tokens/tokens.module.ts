import { ISessionsModuleOptions } from 'src/sessions/interface/sessions-module-options.interface';
import { REDIS_TOKENS_CLIENT } from './constants/redis-tokens-client.token.constant';
import { ITokensModuleOptions } from './interfaces/tokens-module-options.interface';
import { TOKEN_MODULE_OPTS } from './constants/tokens-module-opts.constant';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { TokensService } from './tokens.service';
import { JwtModule } from '@nestjs/jwt';
import {
    ConfigurableModuleAsyncOptions,
    DynamicModule,
    Module,
} from '@nestjs/common';

@Module({})
export class TokensModule {
    static forFeature(
        options: ConfigurableModuleAsyncOptions<ITokensModuleOptions>,
    ): DynamicModule {
        if (options.useFactory) {
            // Provides the options used to configure this module
            const moduleOptionsProvider = {
                provide: TOKEN_MODULE_OPTS,
                useFactory: options.useFactory,
                inject: options.inject,
            };
            return {
                module: TokensModule,
                imports: [
                    ...(options.imports ?? []),
                    JwtModule.registerAsync({
                        extraProviders: [moduleOptionsProvider],
                        inject: [TOKEN_MODULE_OPTS],
                        useFactory: (moduleOpts: ITokensModuleOptions) => ({
                            secret: moduleOpts.tokenSecret,
                            signOptions: { expiresIn: moduleOpts.expiresIn },
                        }),
                    }),
                ],
                providers: [
                    moduleOptionsProvider,
                    {
                        provide: REDIS_TOKENS_CLIENT,
                        useFactory: async (opts: ISessionsModuleOptions) => {
                            const redisAdapter = new RedisAdapter({
                                uri: opts.redisUri,
                            });
                            await redisAdapter.connection.connect();
                            return redisAdapter;
                        },
                        inject: [TOKEN_MODULE_OPTS],
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
