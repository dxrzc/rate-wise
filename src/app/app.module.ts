import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { RedisConfigService } from 'src/config/services/redis-config.service';
import { globalRequestInterceptor } from './interceptors/request.interceptor';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { globalValidationPipe } from './pipes/validation.pipe';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmConfigService } from './typeorm/typeorm.config';
import { AppConfigModule } from 'src/config/app-config.module';
import { Environment } from 'src/common/enum/environment.enum';
import { WinstonConfigService } from './logger/logger.config';
import { GqlConfigService } from './graphql/graphql.config';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { ItemsModule } from 'src/items/items.module';
import { ConditionalModule } from '@nestjs/config';
import { globalGuard } from './guards/auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { SeedModule } from 'src/seed/seed.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { WinstonModule } from 'nest-winston';
import { ClsModule } from 'nestjs-cls';

@Module({
    providers: [
        SessionMiddlewareFactory,
        globalGuard,
        globalValidationPipe,
        globalRequestInterceptor,
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
