import { Review } from 'src/reviews/entities/review.entity';
import { testKit } from './test-kit.util';
import { UserRole } from 'src/users/enums/user-role.enum';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { createAccount } from './create-account.util';
import { createItem } from './create-item.util';

/**
 * Creates a review with default values
 */
export async function createReview(itemId?: string, userId?: string): Promise<Review> {
    if (!userId) {
        const { id } = await createAccount({
            roles: [UserRole.REVIEWER],
            status: AccountStatus.ACTIVE,
        });
        userId = id;
    }
    if (!itemId) {
        const { id: createdItemId } = await createItem(userId);
        itemId = createdItemId;
    }

    return await testKit.reviewRepos.save({
        ...testKit.reviewSeed.reviewInput,
        relatedItem: itemId,
        createdBy: userId,
    });
}
