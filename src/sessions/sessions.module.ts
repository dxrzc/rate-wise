import { DynamicModule, Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { RedisClientAdapter } from 'src/redis/client/redis.client.adapter';
import { FactoryConfigModule } from 'src/common/types/factory-config.module.type';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { SESSIONS_ROOT_OPTIONS, SESSIONS_REDIS_CONNECTION } from './di/sessions.providers';
import { SessionsEvents } from './events/sessions.events';
import { ISessionsRootOptions } from './config/sessions-root.interface';
import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { SessionsService } from './sessions.service';
import { RedisConnection } from 'src/redis/client/redis.connection';

@Global()
@Module({})
export class SessionsModule implements OnApplicationShutdown {
    private static redisConnection: RedisConnection;

    async onApplicationShutdown() {
        await SessionsModule.redisConnection.disconnect();
    }

    static forRootAsync(options: FactoryConfigModule<ISessionsRootOptions>): DynamicModule {
        return {
            module: SessionsModule,
            imports: [
                ...(options.imports || []),
                HttpLoggerModule.forFeature({ context: SessionsService.name }),
            ],
            providers: [
                {
                    provide: SESSIONS_ROOT_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                {
                    provide: SESSIONS_REDIS_CONNECTION,
                    useFactory: async (moduleOpts: ISessionsRootOptions) => {
                        const redisClient = new RedisClientAdapter({
                            context: SessionsModule.name,
                            redisUri: moduleOpts.connection.redisUri,
                            disableOfflineQueue: true,
                        });
                        SessionsModule.redisConnection = redisClient.connection;
                        await redisClient.connection.connect();
                        return redisClient;
                    },
                    inject: [SESSIONS_ROOT_OPTIONS],
                },
                SessionsService,
                SessionMiddlewareFactory,
                SessionsEvents,
            ],
            exports: [SessionsService, SessionMiddlewareFactory, SESSIONS_REDIS_CONNECTION],
        };
    }
}
