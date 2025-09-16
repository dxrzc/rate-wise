import { appGraphqlExceptionFilter } from './providers/filters/app-graphql-exception.filter.provider';
import { SessionMiddlewareFactory } from './providers/middlewares/session.middleware.factory';
import { appValidationPipe } from './providers/pipes/app-validation.pipe.provider';
import { RequestContextPlugin } from 'src/common/plugins/request-context.plugin';
import { appAuthGuard } from './providers/guards/app-auth.guard.provider';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmConfigService } from './imports/typeorm/typeorm.import';
import { DbConfigService } from 'src/config/services/db.config.service';
import { GqlConfigService } from './imports/graphql/graphql.import';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Environment } from 'src/common/enum/environment.enum';
import { LoggingModule } from 'src/logging/logging.module';
import { ConfigModule } from 'src/config/config.module';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { ItemsModule } from 'src/items/items.module';
import { ConditionalModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { SeedModule } from 'src/seed/seed.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ClsModule } from 'nestjs-cls';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
    providers: [
        RequestContextPlugin,
        appGraphqlExceptionFilter,
        SessionMiddlewareFactory,
        appValidationPipe,
        appAuthGuard,
    ],
    imports: [
        ConfigModule,
        SessionsModule.forRootAsync({
            inject: [DbConfigService],
            useFactory: (dbConfig: DbConfigService) => ({
                redisUri: dbConfig.redisAuthUri,
            }),
        }),
        ClsModule.forRoot({
            global: true,
            middleware: { mount: true },
        }),
        RedisModule.forRootAsync({
            isGlobal: true,
            inject: [DbConfigService],
            useFactory: (dbConfig: DbConfigService) => ({
                uri: dbConfig.redisAuthUri,
            }),
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
