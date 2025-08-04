import { Module } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { ItemsService } from './items.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsResolver } from './items.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([Item])],
    providers: [ItemsService, ItemsResolver],
})
export class ItemsModule {}
