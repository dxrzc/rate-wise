import { appRequestTracingInterceptor } from './providers/interceptors/app-reqtracing.interceptor.provider';
import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { appValidationPipe } from './providers/pipes/app-validation.pipe.provider';
import { RedisConfigService } from 'src/config/services/redis-config.service';
import { appAuthGuard } from './providers/guards/app-auth.guard.provider';
import { WinstonConfigService } from './imports/logging/winston.import';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmConfigService } from './imports/typeorm/typeorm.import';
import { GqlConfigService } from './imports/graphql/graphql.import';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppConfigModule } from 'src/config/app-config.module';
import { Environment } from 'src/common/enum/environment.enum';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { ItemsModule } from 'src/items/items.module';
import { ConditionalModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { SeedModule } from 'src/seed/seed.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { WinstonModule } from 'nest-winston';
import { ClsModule } from 'nestjs-cls';

@Module({
    providers: [
        SessionMiddlewareFactory,
        appRequestTracingInterceptor,
        appValidationPipe,
        appAuthGuard,
    ],
    imports: [
        AppConfigModule,
        ClsModule.forRoot({
            global: true,
            middleware: { mount: true },
        }),
        RedisModule.forRootAsync({
            isGlobal: true,
            inject: [RedisConfigService],
            useFactory: (redisConfigService: RedisConfigService) => ({
                uri: redisConfigService.uri,
            }),
        }),
        WinstonModule.forRootAsync({
            useClass: WinstonConfigService,
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
