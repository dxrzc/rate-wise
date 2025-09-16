import { RedisSessionsConnectionManager } from './connections/redis.sessions.connection';
import { ISessionsModuleOptions } from './interface/sessions-module-options.interface';
import { SESSIONS_MODULE_OPTIONS } from './constants/sessions-module-options.constant';
import { REDIS_SESSIONS_CLIENT } from './constants/redis-sessions-client.constant';
import { SessionsService } from './sessions.service';
import { createClient } from '@redis/client';
import {
    ConfigurableModuleAsyncOptions,
    DynamicModule,
    Global,
    Module,
} from '@nestjs/common';

@Global()
@Module({})
export class SessionsModule {
    static forRootAsync(
        options: ConfigurableModuleAsyncOptions<ISessionsModuleOptions>,
    ): DynamicModule {
        if (options.useFactory) {
            return {
                module: SessionsModule,
                imports: options.imports || [],
                providers: [
                    {
                        provide: SESSIONS_MODULE_OPTIONS,
                        useFactory: options.useFactory,
                        inject: options.inject,
                    },
                    {
                        provide: REDIS_SESSIONS_CLIENT,
                        useFactory: (opts: ISessionsModuleOptions) => {
                            return createClient({ url: opts.redisUri });
                        },
                        inject: [SESSIONS_MODULE_OPTIONS],
                    },
                    RedisSessionsConnectionManager,
                    SessionsService,
                ],
                exports: [SessionsService],
            };
        } else {
            throw new Error('This module must be configured by "useFactory"');
        }
    }
}
