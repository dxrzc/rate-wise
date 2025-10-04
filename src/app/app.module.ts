import { appGraphqlExceptionFilter } from './providers/filters/app-graphql-exception.filter.provider';
import { SessionMiddlewareFactory } from 'src/sessions/middlewares/session.middleware.factory';
import { appValidationPipe } from './providers/pipes/app-validation.pipe.provider';
import { RequestContextPlugin } from 'src/common/plugins/request-context.plugin';
import { appAuthGuard } from './providers/guards/app-auth.guard.provider';
import { TypeOrmConfigService } from './imports/typeorm/typeorm.import';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GqlConfigService } from './imports/graphql/graphql.import';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Environment } from 'src/common/enum/environment.enum';
import { SessionsModule } from 'src/sessions/sessions.module';
import { ConfigModule } from 'src/config/config.module';
import { UsersModule } from 'src/users/users.module';
import { ItemsModule } from 'src/items/items.module';
import { RedisModule } from 'src/redis/redis.module';
import { ConditionalModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { SeedModule } from 'src/seed/seed.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ClsModule } from 'nestjs-cls';
import { DbConfigService } from 'src/config/services/db.config.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Module({
    providers: [
        RequestContextPlugin,
        appGraphqlExceptionFilter,
        appValidationPipe,
        appAuthGuard,
    ],
    imports: [
        ConfigModule,
        HttpLoggerModule.forRootAsync({
            inject: [ServerConfigService],
            useFactory: (serverConfig: ServerConfigService) => {
                const logsDir = serverConfig.isProduction
                    ? 'logs/prod'
                    : 'logs/dev';
                return {
                    requests: {
                        dir: logsDir,
                        filename: 'request.log',
                    },
                    messages: {
                        filesystem: {
                            filename: 'messages.log',
                            minLevel: 'info',
                            dir: logsDir,
                        },
                        console: {
                            minLevel: serverConfig.isDevelopment
                                ? 'debug'
                                : 'info',
                        },
                    },
                };
            },
        }),
        RedisModule.forRootAsync({
            inject: [DbConfigService],
            useFactory: (dbConfig: DbConfigService) => ({
                redisAuth: dbConfig.redisAuthUri,
            }),
        }),
        SessionsModule.forRootAsync({
            inject: [AuthConfigService, ServerConfigService],
            useFactory: (
                authConfig: AuthConfigService,
                serverConfig: ServerConfigService,
            ) => ({
                cookieMaxAgeMs: authConfig.sessCookieMaxAgeMs,
                cookieName: authConfig.sessCookieName,
                cookieSecret: authConfig.sessCookieSecret,
                secure: serverConfig.isDevelopment,
            }),
        }),
        ClsModule.forRoot({
            global: true,
            middleware: { mount: true },
        }),
        TypeOrmModule.forRootAsync({
            useClass: TypeOrmConfigService,
        }),
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            useClass: GqlConfigService,
        }),
        ConditionalModule.registerWhen(
            SeedModule,
            (env: NodeJS.ProcessEnv) => env.NODE_ENV !== Environment.PRODUCTION,
        ),
        UsersModule,
        ItemsModule,
        AuthModule,
    ],
})
export class AppModule implements NestModule {
    constructor(
        private readonly sessionMiddlewareFactory: SessionMiddlewareFactory,
    ) {}

    configure(consumer: MiddlewareConsumer) {
        consumer.apply(this.sessionMiddlewareFactory.create()).forRoutes('*');
    }
}
