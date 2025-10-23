import {
    DynamicModule,
    Global,
    Module,
    OnApplicationShutdown,
} from '@nestjs/common';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import {
    SESSIONS_OPTIONS,
    SESSIONS_REDIS_CONNECTION,
} from './constants/sessions.constants';
import { SessionsEvents } from './events/sessions.events';
import { ISessionsOptions } from './interfaces/sessions.options.interface';
import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { SessionsService } from './sessions.service';
import { RedisConnection } from 'src/common/redis/redis.connection';

@Global()
@Module({})
export class SessionsModule implements OnApplicationShutdown {
    private static redisConnection: RedisConnection;

    async onApplicationShutdown() {
        await SessionsModule.redisConnection.disconnect();
    }

    static forRootAsync(
        options: FactoryConfigModule<ISessionsOptions>,
    ): DynamicModule {
        return {
            module: SessionsModule,
            imports: [
                ...(options.imports || []),
                HttpLoggerModule.forFeature({ context: SessionsService.name }),
            ],
            providers: [
                {
                    provide: SESSIONS_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                {
                    provide: SESSIONS_REDIS_CONNECTION,
                    useFactory: async (moduleOpts: ISessionsOptions) => {
                        const redisUri = moduleOpts.connection.redisUri;
                        const redisClient = new RedisClientAdapter(
                            redisUri,
                            SessionsModule.name,
                        );
                        SessionsModule.redisConnection = redisClient.connection;
                        await redisClient.connection.connect();
                        return redisClient;
                    },
                    inject: [SESSIONS_OPTIONS],
                },
                SessionsService,
                SessionMiddlewareFactory,
                SessionsEvents,
            ],
            exports: [SessionsService, SessionMiddlewareFactory],
        };
    }
}
