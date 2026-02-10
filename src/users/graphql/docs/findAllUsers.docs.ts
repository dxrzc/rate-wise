import { QueryOptions } from '@nestjs/graphql';

export const findAllUsersDocs: QueryOptions = {
    name: 'findAllUsers',
    description: `
Retrieves all users with efficient **cursor-based pagination**.

- **Returns:** A paginated response containing:
  - \`edges\`: Array of user nodes with their cursors.
  - \`nodes\`: Array of user objects (shorthand access).
  - \`totalCount\`: Total number of users in the system.
  - \`hasNextPage\`: Boolean indicating if more results exist.

- **Constraints:**
  - \`limit\`: Number of items per page (min: 1, max: 100, default: 10).
  - \`cursor\`: Optional opaque cursor for fetching the next page.

- **Pagination Implementation:**
  - Uses **cursor-based pagination**.
  - Cursors are opaque base64-encoded strings containing \`createdAt\` timestamp and \`id\`.
  - Avoids the offset pagination pitfalls (inconsistent results during concurrent writes).
  - Results are sorted by \`createdAt ASC\`, then \`id ASC\` for deterministic ordering.
  - LIMIT+1 technique used to efficiently detect \`hasNextPage\`.

- **Caching Strategy:**  
  - Individual user records leverage the **Redis** cache layer.
  - Uncached users are fetched from PostgreSQL and then queued for caching via **BullMQ**.
  - Batch cache operations (\`mget\`) minimize Redis round-trips.

- **Rate Limiting:** 100 requests per minute per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Performance:**  
  - Indexed queries on \`(createdAt, id)\` for optimal keyset pagination.  

- **Additional Notes:**
  - Password fields are never included in responses.  

- **Possible Errors:**  
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
