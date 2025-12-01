import { QueryOptions } from '@nestjs/graphql';

export const findAllUsersDocs: QueryOptions = {
    name: 'findAllUsers',
    description: `
        Find all users with cursor-based pagination.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
        **Rate Limiting:** Balanced throttle applied
        
        **Returns:** Paginated list of users with edges, nodes, total count, and hasNextPage indicator
    `,
};
