import { Module } from '@nestjs/common';
import { ReviewService as ReviewsService } from './reviews.service';
import { ReviewResolver as ReviewsResolver } from './reviews.resolver';
import { Review } from './entities/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsModule } from 'src/items/items.module';
import { Item } from 'src/items/entities/item.entity';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review, Item]),
        ItemsModule,
        HttpLoggerModule.forFeature({ context: 'Reviews' }),
    ],
    providers: [ReviewsService, ReviewsResolver],
})
export class ReviewsModule {}
