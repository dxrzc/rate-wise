import { Injectable } from '@nestjs/common';
import { CreateReviewInput } from './dtos/create-review.input';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemsService } from 'src/items/items.service';
import { Item } from 'src/items/entities/item.entity';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';

@Injectable()
export class ReviewService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        private readonly itemsService: ItemsService,
        private readonly logger: HttpLoggerService,
    ) {}

    private async refreshItemAvgRating(item: Item) {
        const itemReviews = await this.reviewRepository.find({
            select: { rating: true },
            where: { relatedItem: item.id },
        });
        const itemReviewsRating = itemReviews.map((i) => i.rating);
        const newAvg =
            itemReviewsRating.reduce((prev, curr) => prev + curr, 0) / itemReviews.length;
        await this.itemsService.updateItemAvgRating(item, newAvg);
    }

    async createOne(reviewData: CreateReviewInput, user: AuthenticatedUser) {
        const item = await this.itemsService.findOneByIdOrThrow(reviewData.itemId);
        const review = await this.reviewRepository.save({
            ...reviewData,
            relatedItem: item.id,
            createdBy: user.id,
        });
        this.logger.info(`Created review for item ${item.id} by user ${user.id}`);
        await this.refreshItemAvgRating(item);
        return review;
    }
}
