import { MutationOptions } from '@nestjs/graphql';

export const deleteVoteDocs: MutationOptions = {
    name: 'deleteVote',
    description: `
        Remove a vote from a review.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** REVIEWER role required
        
        **Account Status Required:** ACTIVE - only users with active accounts can remove votes
        
        **Effect:** Removes the user's vote from a review. The review's vote counts (upvotes and downvotes) are automatically updated in a transaction.
        
        **Rate Limiting:** Relaxed throttle applied
        
        **Returns:** Boolean true if the vote was removed, false if no vote existed.
    `,
};
