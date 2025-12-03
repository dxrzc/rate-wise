import { QueryOptions } from '@nestjs/graphql';

export const findAllItemsDocs: QueryOptions = {
    name: 'findAllItems',
    description: `
        Find all items with cursor-based pagination.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
        **Rate Limiting:** Balanced throttle applied
        
        **Returns:** Paginated list of all items with edges, nodes, total count, and hasNextPage indicator
    `,
};
