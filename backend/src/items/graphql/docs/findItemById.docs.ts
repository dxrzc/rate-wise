import { QueryOptions } from '@nestjs/graphql';

export const findItemByIdDocs: QueryOptions = {
    name: 'findItemById',
    description: `
Retrieves an item by its unique identifier (UUID).

- **Returns:** Item details.

- **Constraints:**
  - The \`item_id\` must be a valid UUID v4 format.
  - Item must exist in the database.

- **Caching Strategy:**
  - Results are cached in **Redis** with automatic TTL expiration.
  - Checks cache first, fetches from PostgreSQL on miss, then caches the result.
  - Subsequent requests for the same item ID return cached data for improved performance.  
  - Cache is invalidated when item data is modified.

- **Rate Limiting:** 1000 requests per minute per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Related Fields (GraphQL):**
  - \`averageRating\`: Computed dynamically from all reviews.
  - \`reviews\`: Paginated list of reviews for this item.

- **Performance:**
  - UUID validation occurs before database query (early rejection of invalid IDs).
  - Indexed lookup by primary key ensures O(1) database performance.
  - Redis caching reduces database load for popular items.

- **Additional Notes:**
  - Use \`filterItems\` query to search items by category, tag, or creator.
  - The \`averageRating\` field triggers a separate database aggregation query.

- **Possible Errors:**
  - \`NOT_FOUND\`: Item with the provided ID does not exist or invalid UUID format.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
