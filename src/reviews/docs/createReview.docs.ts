import { MutationOptions } from '@nestjs/graphql';

export const createReviewDocs: MutationOptions = {
    name: 'createReview',
    description: `
        Create a new review for an item with a rating and text content.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** All roles allowed (USER, MODERATOR, ADMIN)
        
        **Account Status Required:** ACTIVE - only users with active accounts can create reviews
        
        **Effect:** Creates a new review with content (10-2000 characters) and rating (0-10) for the specified item. The review is associated with the authenticated user. The item's average rating is recalculated upon review creation.
        
        **Rate Limiting:** Relaxed throttle applied
        
        **Returns:** The created review with ID, timestamps, content, rating, initial vote count (0), creator ID, and related item ID
    `,
};
