export const filterReviewsDocs = {
    name: 'filterReviews',
    description: `
Retrieves reviews with **cursor-based pagination** and optional filtering by creator or related item.

- **Returns:** A paginated response containing:
  - \`edges\`: Array of review nodes with their cursors.
  - \`nodes\`: Array of review objects (shorthand access).
  - \`totalCount\`: Total number of reviews matching the filter criteria.
  - \`hasNextPage\`: Boolean indicating if more results exist.

- **Constraints:**
  - \`limit\`: Number of reviews per page (min: 1, max: 100, default: 10).
  - \`cursor\`: Optional opaque cursor for fetching the next page.
  - \`createdBy\`: Optional UUID to filter reviews by author.
  - \`relatedItem\`: Optional UUID to filter reviews for a specific item.

- **Side Effects:**
  - If \`createdBy\` is provided, user existence is validated first.
  - If \`relatedItem\` is provided, item existence is validated first.

- **Pagination Implementation:**
  - Uses **cursor-based pagination**.
  - Cursors are opaque base64-encoded strings containing \`createdAt\` timestamp and \`id\`.
  - Results sorted by \`createdAt ASC\`, then \`id ASC\` for deterministic ordering.
  - LIMIT+1 technique used to efficiently detect \`hasNextPage\`.

- **Filtering:**
  - Filters are combined with AND logic.
  - \`createdBy\`: Filters reviews by author's user ID.
  - \`relatedItem\`: Filters reviews for a specific item.  

- **Caching Strategy:**
  - Individual review records leverage the **Redis** cache layer.
  - Uncached reviews are fetched from PostgreSQL and queued for caching via **BullMQ**.
  - Batch cache operations (\`mget\`) minimize Redis round-trips.

- **Rate Limiting:** 100 requests per minute per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Performance:**
  - Indexed columns: \`createdBy\`, \`relatedItem\`, \`createdAt\`, \`id\`.  
  - Vote counts (\`upvotes\`, \`downvotes\`) are denormalized for fast reads.

- **Possible Errors:**
  - \`NOT_FOUND\`: \`createdBy\` user or \`relatedItem\` item does not exist OR invalid UUID format. 
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded. 
  
    `,
};
