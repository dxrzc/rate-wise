import { Review } from 'src/reviews/entities/review.entity';
import { testKit } from './test-kit.util';

export async function createReview(itemId: string, userId: string): Promise<Review> {
    return await testKit.reviewRepos.save({
        ...testKit.reviewSeed.review,
        relatedItem: itemId,
        createdBy: userId,
    });
}
