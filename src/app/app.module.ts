import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from 'src/auth/auth.module';
import { Environment } from 'src/common/enum/environment.enum';
import { RequestContextPlugin } from 'src/common/plugins/request-context.plugin';
import { ConfigModule } from 'src/config/config.module';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { DbConfigService } from 'src/config/services/db.config.service';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { SmtpConfigService } from 'src/config/services/smtp.config.service';
import { EmailsModule } from 'src/emails/emails.module';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { ItemsModule } from 'src/items/items.module';
import { SeedModule } from 'src/seed/seed.module';
import { SessionMiddlewareFactory } from 'src/sessions/middlewares/session.middleware.factory';
import { SessionsModule } from 'src/sessions/sessions.module';
import { UsersModule } from 'src/users/users.module';
import { GqlConfigService } from './imports/graphql/graphql.import';
import { HttpLoggerConfigService } from './imports/http-logger/http-logger.import';
import { TypeOrmConfigService } from './imports/typeorm/typeorm.import';
import { catchEverythingFiler } from './providers/filters/catch-everything.filter.provider';
import { appAuthGuard } from './providers/guards/app-auth.guard.provider';
import { appValidationPipe } from './providers/pipes/app-validation.pipe.provider';
import { TokensModule } from 'src/tokens/tokens.module';
import { gqlThrottlerGuard } from './providers/guards/graphql-throttler.guard.provider';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RestLoggingMiddleware } from 'src/common/middlewares/rest.logging.middleware';
import { AuthController } from 'src/auth/auth.controller';

/**
 * NOTE: Non-api modules are configured explictly here using forRootAsync.
 * This keeps the modules isolated. It is important to follow this pattern
 * in order to test the modules in `components` tests and abstract all the
 * configurations in this module.
 * In a nutshell, every non-api module MUST be able to be constructed
 * without relying on global configurations.
 */

@Module({
    providers: [
        RequestContextPlugin,
        catchEverythingFiler,
        appValidationPipe,
        gqlThrottlerGuard,
        appAuthGuard,
    ],
    imports: [
        ConfigModule,
        EmailsModule,
        ThrottlerModule.forRootAsync({
            inject: [DbConfigService],
            useFactory: ({ redisAuthUri }: DbConfigService) => ({
                // default policy, overrided with decorators
                throttlers: [{ ttl: 10 * minutes(1), limit: 10 * 1000 }],
                storage: new ThrottlerStorageRedisService(redisAuthUri),
            }),
        }),
        EmailsModule.forRootAsync({
            inject: [SmtpConfigService],
            useFactory: (smtpConfig: SmtpConfigService) => ({
                smtp: {
                    port: smtpConfig.port,
                    host: smtpConfig.host,
                    user: smtpConfig.user,
                    pass: smtpConfig.pass,
                },
            }),
        }),
        BullModule.forRootAsync({
            inject: [DbConfigService],
            useFactory: (dbConfig: DbConfigService) => ({
                connection: {
                    url: dbConfig.redisQueuesUri,
                },
            }),
        }),
        HttpLoggerModule.forRootAsync({
            useClass: HttpLoggerConfigService,
        }),
        HttpLoggerModule.forFeature({ context: 'App' }),
        TokensModule.forRootAsync({
            inject: [DbConfigService],
            useFactory: (dbConfig: DbConfigService) => ({
                connection: {
                    redisUri: dbConfig.redisAuthUri,
                },
            }),
        }),
        SessionsModule.forRootAsync({
            inject: [AuthConfigService, ServerConfigService, DbConfigService],
            useFactory: (
                authConfig: AuthConfigService,
                serverConfig: ServerConfigService,
                dbConfig: DbConfigService,
            ) => ({
                cookieMaxAgeMs: authConfig.sessCookieMaxAgeMs,
                cookieName: authConfig.sessCookieName,
                cookieSecret: authConfig.sessCookieSecret,
                secure: serverConfig.isProduction,
                connection: {
                    redisUri: dbConfig.redisAuthUri,
                },
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
            imports: [HttpLoggerModule.forFeature({ context: 'GraphQL' })],
            useClass: GqlConfigService,
            driver: ApolloDriver,
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
        consumer.apply(RestLoggingMiddleware).forRoutes(AuthController);
    }
}
