import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { DbConfigService } from 'src/config/services/db.config.service';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
    constructor(private readonly dbConfigService: DbConfigService) {}

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            synchronize: false,
            url: this.dbConfigService.postgresUri,
            autoLoadEntities: false,
            entities: [User, Item],
            type: 'postgres',
            retryDelay: 1000,
            retryAttempts: 3,
        };
    }
}
