import { QueryOptions } from '@nestjs/graphql';

export const findAllItemReviewsDocs: QueryOptions = {
    name: 'findAllItemReviews',
    description: `
        Find all reviews for a specific item with cursor-based pagination.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
        **Rate Limiting:** Balanced throttle applied
        
        **Returns:** Paginated list of reviews for the specified item, including edges, nodes, total count, and hasNextPage indicator
    `,
};
