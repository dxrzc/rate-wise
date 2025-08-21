import { DatabaseConfigService } from 'src/config/services/database-config.service';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
    constructor(private readonly dbConfigService: DatabaseConfigService) {}

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            synchronize: false,
            url: this.dbConfigService.uri,
            autoLoadEntities: false,
            entities: [User, Item],
            type: 'postgres',
            retryDelay: 1000,
            retryAttempts: 3,
        };
    }
}
