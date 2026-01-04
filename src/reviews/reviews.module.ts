import { Module } from '@nestjs/common';
import { ReviewService as ReviewsService } from './reviews.service';
import { ReviewResolver as ReviewsResolver } from './reviews.resolver';
import { Review } from './entities/review.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ItemsModule } from 'src/items/items.module';
import { Item } from 'src/items/entities/item.entity';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { PaginationModule } from 'src/pagination/pagination.module';
import { createReviewCacheKey } from './cache/create-cache-key';
import { User } from 'src/users/entities/user.entity';
import { ItemReviewsResolver } from './item-reviews.resolver';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review, Item, User]),
        ItemsModule,
        UsersModule,
        HttpLoggerModule.forFeature({ context: 'Reviews' }),
        PaginationModule.register({
            createCacheKeyFunction: createReviewCacheKey,
            repositoryToken: getRepositoryToken(Review),
        }),
    ],
    providers: [ReviewsService, ReviewsResolver, ItemReviewsResolver],
    exports: [ReviewsService],
})
export class ReviewsModule {}
