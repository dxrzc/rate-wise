import { forwardRef, Module } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { ItemsService } from './items.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ItemsResolver } from './items.resolver';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { createItemCacheKey } from './cache/create-cache-key';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { UsersModule } from 'src/users/users.module';
import { UserItemsResolver } from './user-items.resolver';

@Module({
    imports: [
        forwardRef(() => ReviewsModule),
        forwardRef(() => UsersModule),
        PaginationModule.register({
            createCacheKeyFunction: createItemCacheKey,
            repositoryToken: getRepositoryToken(Item),
        }),
        HttpLoggerModule.forFeature({ context: 'Items' }),
        TypeOrmModule.forFeature([Item]),
    ],
    providers: [ItemsService, ItemsResolver, UserItemsResolver],
    exports: [ItemsService],
})
export class ItemsModule {}
