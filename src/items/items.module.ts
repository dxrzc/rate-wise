import { Module } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { ItemsService } from './items.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsResolver } from './items.resolver';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Module({
    imports: [TypeOrmModule.forFeature([Item]), HttpLoggerModule.forFeature({ context: 'Items' })],
    providers: [ItemsService, ItemsResolver],
})
export class ItemsModule {}
