import { MutationOptions } from '@nestjs/graphql';

export const voteReviewDocs: MutationOptions = {
    name: 'voteReview',
    description: `
        Vote on a review by upvoting or downvoting it.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** REVIEWER role required
        
        **Account Status Required:** ACTIVE - only users with active accounts can vote on reviews
        
        **Effect:** Records the user's vote (upvote or downvote) on a review. If the user has previously voted on the same review with a different vote type, the previous vote is removed and replaced with the new vote. If the user votes with the same vote type again, the operation is idempotent (no change occurs). The review's vote counts (upvotes and downvotes) are automatically updated in a transaction.
        
        **Rate Limiting:** Relaxed throttle applied
        
        **Returns:** Boolean true upon successful vote recording
    `,
};

export const voteReview = voteReviewDocs;
