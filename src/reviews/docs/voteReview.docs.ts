import { MutationOptions } from '@nestjs/graphql';

export const voteReviewDocs: MutationOptions = {
    name: 'voteReview',
    description: `
        Vote for a review to help highlight helpful reviews to other users.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** All roles allowed (USER, MODERATOR, ADMIN)
        
        **Account Status Required:** ACTIVE - only users with active accounts can vote on reviews
        
        **Effect:** Increments the vote count for the specified review by 1. This helps surface the most helpful reviews to other users.
        
        **Rate Limiting:** Relaxed throttle applied
        
        **Returns:** Boolean indicating success (true)
    `,
};
