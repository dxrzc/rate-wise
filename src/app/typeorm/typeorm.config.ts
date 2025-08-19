import { DatabaseConfigService } from 'src/config/services/database-config.service';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Environment } from 'src/common/enum/environment.enum';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
    constructor(
        private readonly serverConfig: ServerConfigService,
        private readonly dbConfigService: DatabaseConfigService,
    ) {}

    createTypeOrmOptions(): TypeOrmModuleOptions {
        const environment = this.serverConfig.environment;
        return {
            synchronize: environment !== Environment.PRODUCTION,
            url: this.dbConfigService.uri,
            autoLoadEntities: false,
            entities: [User, Item],
            type: 'postgres',
            retryDelay: 1000,
            retryAttempts: 3,
        };
    }
}
