import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseConfigService } from './config/services/postgres-db.config.service';

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
    ],
})
export class AppModule {}
