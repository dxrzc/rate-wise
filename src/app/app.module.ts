import { appGraphqlExceptionFilter } from './providers/filters/app-graphql-exception.filter.provider';
import { SessionMiddlewareFactory } from 'src/sessions/middlewares/session.middleware.factory';
import { appValidationPipe } from './providers/pipes/app-validation.pipe.provider';
import { RequestContextPlugin } from 'src/common/plugins/request-context.plugin';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { appAuthGuard } from './providers/guards/app-auth.guard.provider';
import { TypeOrmConfigService } from './imports/typeorm/typeorm.import';
import { DbConfigService } from 'src/config/services/db.config.service';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GqlConfigService } from './imports/graphql/graphql.import';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Environment } from 'src/common/enum/environment.enum';
import { SessionsModule } from 'src/sessions/sessions.module';
import { LoggingModule } from 'src/logging/logging.module';
import { ConfigModule } from 'src/config/config.module';
import { UsersModule } from 'src/users/users.module';
import { ItemsModule } from 'src/items/items.module';
import { ConditionalModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { SeedModule } from 'src/seed/seed.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ClsModule } from 'nestjs-cls';

@Module({
    providers: [
        RequestContextPlugin,
        appGraphqlExceptionFilter,
        appValidationPipe,
        appAuthGuard,
    ],
    imports: [
        ConfigModule,
        SessionsModule.forRootAsync({
            inject: [DbConfigService, AuthConfigService],
            useFactory: (
                dbConfig: DbConfigService,
                authConfig: AuthConfigService,
            ) => ({
                cookieMaxAgeMs: authConfig.sessCookieMaxAgeMs,
                cookieName: authConfig.sessCookieName,
                cookieSecret: authConfig.sessCookieSecret,
                redisUri: dbConfig.redisAuthUri,
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
        LoggingModule,
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
