import { Module } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { ItemsService } from './items.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ItemsResolver } from './items.resolver';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { rawRecordToItemEntity } from './functions/raw-record-to-item-entity';

@Module({
    imports: [
        PaginationModule.register({
            repositoryToken: getRepositoryToken(Item),
            transformFunction: rawRecordToItemEntity,
        }),
        HttpLoggerModule.forFeature({ context: 'Items' }),
        TypeOrmModule.forFeature([Item]),
    ],
    providers: [ItemsService, ItemsResolver],
})
export class ItemsModule {}
