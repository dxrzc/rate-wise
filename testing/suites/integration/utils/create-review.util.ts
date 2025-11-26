import { Review } from 'src/reviews/entities/review.entity';
import { testKit } from './test-kit.util';

/**
 * Creates a review with default values
 */
export async function createReview(itemId: string, userId: string): Promise<Review> {
    return await testKit.reviewRepos.save({
        ...testKit.reviewSeed.reviewInput,
        relatedItem: itemId,
        createdBy: userId,
    });
}
