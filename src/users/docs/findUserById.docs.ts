import { QueryOptions } from '@nestjs/graphql';

export const findUserByIdDocs: QueryOptions = {
    name: 'findUserById',
    description: `
        Find a user by their unique identifier.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Caching:** Results are cached for improved performance. Subsequent requests for the same user ID may return cached data.
        
        **Rate Limiting:** Relaxed throttle applied
        
        **Returns:** User details including ID, username, email, roles, account status, reputation score, and creation/update timestamps
    `,
};
