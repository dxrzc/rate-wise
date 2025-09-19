import { ISessionsModuleOptions } from './interface/sessions-module-options.interface';
import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { LoggingModule } from 'src/logging/logging.module';
import { SessionsService } from './sessions.service';
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
                imports: [LoggingModule, ...(options.imports ?? [])],
                providers: [
                    {
                        provide: 'SESS_MODULE_OPTS',
                        useFactory: options.useFactory,
                        inject: options.inject,
                    },
                    {
                        provide: 'SESS_REDIS',
                        useFactory: (opts: ISessionsModuleOptions) => {
                            return new RedisAdapter({ uri: opts.redisUri });
                        },
                        inject: ['SESS_MODULE_OPTS'],
                    },
                    SessionMiddlewareFactory,
                    SessionsService,
                ],
                exports: [SessionsService, SessionMiddlewareFactory],
            };
        } else {
            throw new Error('This module must be configured by "useFactory"');
        }
    }
}
