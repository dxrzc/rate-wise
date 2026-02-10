export const filterItemsDocs = {
    name: 'filterItems',
    description: `
Retrieves items with **cursor-based pagination** and optional filtering by creator, category, or tag.

- **Returns:** A paginated response containing:
  - \`edges\`: Array of item nodes with their cursors.
  - \`nodes\`: Array of item objects (shorthand access).
  - \`totalCount\`: Total number of items matching the filter criteria.
  - \`hasNextPage\`: Boolean indicating if more results exist.

- **Constraints:**
  - \`limit\`: Number of items per page (min: 1, max: 100, default: 10).
  - \`cursor\`: Optional opaque cursor for fetching the next page.
  - \`createdBy\`: Optional UUID to filter items by creator (must be valid user ID).
  - \`category\`: Optional string to filter by exact category match.
  - \`tag\`: Optional string to filter items containing this tag.

- **Pagination Implementation:**
  - Uses **cursor-based pagination**.
  - Cursors are opaque base64-encoded strings containing \`createdAt\` timestamp and \`id\`.
  - Results sorted by \`createdAt ASC\`, then \`id ASC\` for deterministic ordering.
  - LIMIT+1 technique used to efficiently detect \`hasNextPage\`.

- **Filtering:**
  - Filters are combined with AND logic.
  - \`category\`: Exact match (case-sensitive after normalization).
  - \`tag\`: Uses PostgreSQL array containment (\`ANY(tags)\`).
  - \`createdBy\`: Filters by creator's user ID.  

- **Caching Strategy:**
  - Individual item records leverage the **Redis** cache layer.
  - Uncached items are fetched from PostgreSQL and queued for caching via **BullMQ**.
  - Batch cache operations (\`mget\`) minimize Redis round-trips.

- **Rate Limiting:**100 requests per minute per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Performance:**
  - Indexed columns: \`createdBy\`, \`category\`, \`createdAt\`, \`id\`.
  - GIN index on \`tags\` array for efficient tag filtering.

- **Possible Errors:**
  - \`NOT_FOUND\`: \`createdBy\` user ID does not exist OR invalid UUID format.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
