import { join } from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ItemsModule } from './items/items.module';
import { Item } from './items/entities/item.entity';
import { User } from './users/entities/user.entity';
import { AppConfigModule } from './config/app-config.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DatabaseConfigService } from './config/services/postgres-db.config.service';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
    imports: [
        AppConfigModule,
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
                synchronize: true,
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
        ItemsModule,
    ],
})
export class AppModule {}
