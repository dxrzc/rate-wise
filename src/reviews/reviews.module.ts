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
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review, Item]),
        ItemsModule,
        HttpLoggerModule.forFeature({ context: 'Reviews' }),
        UsersModule,
        PaginationModule.register({
            createCacheKeyFunction: createReviewCacheKey,
            repositoryToken: getRepositoryToken(Review),
        }),
    ],
    providers: [ReviewsService, ReviewsResolver],
})
export class ReviewsModule {}
