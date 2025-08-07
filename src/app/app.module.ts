import { join } from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';
import { ItemsModule } from 'src/items/items.module';
import { User } from 'src/users/entities/user.entity';
import { Item } from 'src/items/entities/item.entity';
import { AppConfigModule } from 'src/config/app-config.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RedisConfigService } from 'src/config/services/redis-config.service';
import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { DatabaseConfigService } from 'src/config/services/database-config.service';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
    providers: [SessionMiddlewareFactory],
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [AppConfigModule],
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
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            playground: false,
            autoSchemaFile: join(
                process.cwd(),
                'src/common/graphql/schema.gql',
            ),
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
        }),
        RedisModule.forRootAsync({
            isGlobal: true,
            inject: [RedisConfigService],
            useFactory: (redisConfigService: RedisConfigService) => ({
                uri: redisConfigService.uri,
            }),
        }),
        UsersModule,
        ItemsModule,
        AuthModule,
    ],
})
export class AppModule {}
