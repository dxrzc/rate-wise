import { QueryOptions } from '@nestjs/graphql';

export const findAllItemsByTagDocs: QueryOptions = {
    name: 'findAllItemsByTag',
    description: `
        Find all items that contain a specified tag with cursor-based pagination.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
        **Filtering:** Returns only items that have the specified tag in their tags array
        
        **Rate Limiting:** Balanced throttle applied
        
        **Returns:** Paginated list of items with the specified tag, including edges, nodes, total count, and hasNextPage indicator
    `,
};
