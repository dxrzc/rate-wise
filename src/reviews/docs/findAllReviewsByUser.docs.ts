import { QueryOptions } from '@nestjs/graphql';

export const findAllReviewsByUserDocs: QueryOptions = {
    name: 'findAllReviewsByUser',
    description: `
        Find all reviews created by a specific user with cursor-based pagination.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
        **Rate Limiting:** Balanced throttle applied
        
        **Returns:** Paginated list of reviews created by the specified user, including edges, nodes, total count, and hasNextPage indicator
    `,
};
