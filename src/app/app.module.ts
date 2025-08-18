import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { DatabaseConfigService } from 'src/config/services/database-config.service';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { RedisConfigService } from 'src/config/services/redis-config.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppConfigModule } from 'src/config/app-config.module';
import { Environment } from 'src/common/enum/environment.enum';
import { WinstonConfigService } from './logger/logger.config';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { ItemsModule } from 'src/items/items.module';
import { ConditionalModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuthModule } from 'src/auth/auth.module';
import { SeedModule } from 'src/seed/seed.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';
import {
    MiddlewareConsumer,
    Module,
    NestModule,
    ValidationPipe,
} from '@nestjs/common';

@Module({
    providers: [
        SessionMiddlewareFactory,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        },
    ],
    imports: [
        AppConfigModule,
        WinstonModule.forRootAsync({
            useClass: WinstonConfigService,
        }),
        TypeOrmModule.forRootAsync({
            inject: [DatabaseConfigService],
            useFactory: (dbConfigService: DatabaseConfigService) => ({
                type: 'postgres',
                entities: [User, Item],
                url: dbConfigService.uri,
                autoLoadEntities: false,
                retryAttempts: 3,
                retryDelay: 1000,
                synchronize: true, //!
            }),
        }),
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            inject: [ServerConfigService],
            useFactory: ({ environment }: ServerConfigService) => ({
                playground: false,
                plugins: [ApolloServerPluginLandingPageLocalDefault()],
                formatError: (error) => {
                    const code = error.extensions?.code;
                    const stackTrace = error.extensions?.stacktrace;
                    const isDev = environment === Environment.DEVELOPMENT;
                    return {
                        message: error.message,
                        code: code || 'INTERNAL_SERVER_ERROR',
                        stackTrace: isDev ? stackTrace : undefined,
                    };
                },
                autoSchemaFile: join(
                    process.cwd(),
                    'src/common/graphql/schema.gql',
                ),
                context: (context: { req: Request; res: Response }) => ({
                    req: context.req,
                    res: context.res,
                }),
            }),
        }),
        RedisModule.forRootAsync({
            isGlobal: true,
            inject: [RedisConfigService],
            useFactory: (redisConfigService: RedisConfigService) => ({
                uri: redisConfigService.uri,
            }),
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
