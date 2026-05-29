import { QueryOptions } from '@nestjs/graphql';

export const meDocs: QueryOptions = {
    name: 'me',
    description: `
Retrieves the currently authenticated user's profile information.

- **Returns:** Current user's details including profile information and associated items.

- **Constraints:**
  - User must be authenticated (session cookie required).
  - User must exist in the database.

- **Caching Strategy:**
  - Results are cached in **Redis** with automatic TTL expiration.
  - Checks cache first, fetches from PostgreSQL on miss, then caches the result.
  - Subsequent requests return cached data for improved performance.
  - Cache is automatically invalidated when user data is modified.

- **Rate Limiting:** 1000 requests per minute per user.

- **Authentication:** Required.

- **Roles Required:** None (all authenticated users can access).

- **Account Status Required:** N/A.

- **Performance:**
  - Uses cached user lookup for minimal database overhead.
  - No UUID validation required as user ID is retrieved from authenticated session.`,
};
