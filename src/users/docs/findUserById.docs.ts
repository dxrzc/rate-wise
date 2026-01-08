import { QueryOptions } from '@nestjs/graphql';

export const findUserByIdDocs: QueryOptions = {
    name: 'findUserById',
    description: `
Retrieves a user by their unique identifier (UUID).

- **Returns:** User details.

- **Constraints:**
  - The \`user_id\` must be a valid UUID.
  - User must exist in the database.

- **Caching Strategy:**
  - Results are cached in **Redis** with automatic TTL expiration.
  - Checks cache first, fetches from PostgreSQL on miss, then caches the result.
  - Subsequent requests for the same user ID return cached data for improved performance.
  - Cache is automatically invalidated when user data is modified.

- **Rate Limiting:** 1000 requests per minute per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Performance:**
  - UUID validation occurs before database query (early rejection of invalid IDs).
  - Indexed lookup by primary key ensures O(1) database performance.
  - Redis caching reduces database load for popular users.

- **Additional Notes:**
  - The cached user object excludes sensitive fields (password).
  - Use \`findAll\` for paginated user listing.

- **Possible Errors:**
  - \`NOT_FOUND\`: User with the provided ID does not exist or invalid UUID format.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
