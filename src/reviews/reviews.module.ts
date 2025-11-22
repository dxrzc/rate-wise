import { Module } from '@nestjs/common';
import { ReviewService as ReviewsService } from './reviews.service';
import { ReviewResolver as ReviewsResolver } from './reviews.resolver';

@Module({
    providers: [ReviewsService, ReviewsResolver],
})
export class ReviewsModule {}
