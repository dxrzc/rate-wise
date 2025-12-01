import { QueryOptions } from '@nestjs/graphql';

export const findItemByIdDocs: QueryOptions = {
    name: 'findItemById',
    description: `
        Find an item by its unique identifier.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Caching:** Results are cached for improved performance. Subsequent requests for the same item ID may return cached data.
        
        **Rate Limiting:** Relaxed throttle applied
        
        **Returns:** Item details including ID, timestamps, title, description, category, tags, average rating, and creator ID
    `,
};
