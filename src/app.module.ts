import { join } from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
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
                url: dbConfigService.uri,
                entities: [],
                autoLoadEntities: false,
                retryAttempts: 3,
                retryDelay: 1000,
            }),
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            playground: false,
            autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
        }),
    ],
})
export class AppModule {}
