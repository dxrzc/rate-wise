import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AuthController } from 'src/auth/auth.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Environment } from 'src/common/enum/environment.enum';
import { RestLoggingMiddleware } from 'src/common/middlewares/rest.logging.middleware';
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
import { TokensModule } from 'src/tokens/tokens.module';
import { UsersModule } from 'src/users/users.module';
import { AdminModule } from 'src/admin/admin.module';
import { GqlConfigService } from './imports/graphql/graphql.import';
import { HttpLoggerConfigService } from './imports/http-logger/http-logger.import';
import { TypeOrmConfigService } from './imports/typeorm/typeorm.import';
import { catchEverythingFilter } from './providers/filters/catch-everything.filter.provider';
import { appAccountStatusGuard } from './providers/guards/app-account-status.guard.provider';
import { appAuthGuard } from './providers/guards/app-auth.guard.provider';
import { appRolesGuard } from './providers/guards/app-roles.guard.provider';
import { rateLimiterGuard } from './providers/guards/graphql-throttler.guard.provider';
import { appValidationPipe } from './providers/pipes/app-validation.pipe.provider';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { ModerationModule } from 'src/moderation/moderation.module';
import { VotesModule } from 'src/votes/votes.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from 'src/health/health.module';
import { RedisMonitoringModule } from 'src/redis-monitoring/redis-monitoring.module';
import {
    CACHE_REDIS_STORE,
    QUEUE_REDIS_CONNECTION,
    THROTTLER_REDIS_CONNECTION,
} from 'src/redis-monitoring/constants/redis.connections';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';
import { serviceUnavailableErrorFilter } from './providers/filters/service-unavailable.filter.provider';

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
        catchEverythingFilter,
        serviceUnavailableErrorFilter,
        appValidationPipe,
        rateLimiterGuard,
        appAuthGuard,
        appAccountStatusGuard,
        appRolesGuard,
    ],
    imports: [
        HealthModule,
        ConfigModule,
        EmailsModule,
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [RedisMonitoringModule],
            inject: [ServerConfigService, CACHE_REDIS_STORE],
            useFactory: (serverConfig: ServerConfigService, cacheStore: KeyvRedis<unknown>) => ({
                ttl: serverConfig.cacheTtlSeconds * 1000, // milliseconds
                stores: [cacheStore],
            }),
        }),
        ThrottlerModule.forRootAsync({
            imports: [RedisMonitoringModule],
            inject: [THROTTLER_REDIS_CONNECTION],
            useFactory: (ioredisClient: Redis) => ({
                // default policy, overridden by decorators
                throttlers: [{ ttl: 10 * minutes(1), limit: 10 * 1000 }],
                storage: new ThrottlerStorageRedisService(ioredisClient),
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
            imports: [RedisMonitoringModule],
            inject: [QUEUE_REDIS_CONNECTION],
            useFactory: (connection: Redis) => ({ connection }),
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
            imports: [HttpLoggerModule.forFeature({ context: 'Gql Handler' })],
            useClass: GqlConfigService,
            driver: ApolloDriver,
        }),
        ConditionalModule.registerWhen(
            SeedModule,
            (env: NodeJS.ProcessEnv) => env.NODE_ENV !== Environment.PRODUCTION,
        ),
        AdminModule,
        UsersModule,
        ItemsModule,
        ReviewsModule,
        VotesModule,
        ModerationModule,
        AuthModule,
        ScheduleModule.forRoot(),
    ],
})
export class AppModule implements NestModule {
    constructor(private readonly sessionMiddlewareFactory: SessionMiddlewareFactory) {}

    configure(consumer: MiddlewareConsumer) {
        consumer.apply(this.sessionMiddlewareFactory.create()).forRoutes('*');
        consumer.apply(RestLoggingMiddleware).forRoutes(AuthController);
    }
}
