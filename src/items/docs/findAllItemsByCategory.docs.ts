import { QueryOptions } from '@nestjs/graphql';

export const findAllItemsByCategoryDocs: QueryOptions = {
    name: 'findAllItemsByCategory',
    description: `
        Find all items in a specified category with cursor-based pagination.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
        **Filtering:** Returns only items that belong to the specified category
        
        **Rate Limiting:** Balanced throttle applied
        
        **Returns:** Paginated list of items in the specified category, including edges, nodes, total count, and hasNextPage indicator
    `,
};
