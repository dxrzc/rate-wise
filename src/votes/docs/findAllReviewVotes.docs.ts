export const findAllReviewVotesDocs = {
    name: 'findAllVotesForReview',
    description: `
Retrieves all votes for a specific review with **cursor-based pagination**.

- **Returns:** A paginated response containing:
  - \`edges\`: Array of vote nodes with their cursors.
  - \`nodes\`: Array of vote objects (shorthand access).
  - \`totalCount\`: Total number of votes for this review.
  - \`hasNextPage\`: Boolean indicating if more results exist.

- **Constraints:**
  - \`reviewId\`: Must be a valid UUID referencing an existing review.
  - \`limit\`: Number of votes per page (min: 1, max: 100, default: 10).
  - \`cursor\`: Optional opaque cursor for fetching the next page.

- **Side Effects:**  
  - Review existence is validated before fetching votes.

- **Pagination Implementation:**
  - Uses **cursor-based pagination**.
  - Cursors are opaque base64-encoded strings containing \`createdAt\` timestamp and \`id\`.
  - Results sorted by \`createdAt ASC\`, then \`id ASC\` for deterministic ordering.
  - LIMIT+1 technique used to efficiently detect \`hasNextPage\`.

- **Caching Strategy:**
  - Individual vote records leverage the **Redis** cache layer.
  - Uncached votes are fetched from PostgreSQL and queued for caching via **BullMQ**.
  - Batch cache operations (\`mget\`) minimize Redis round-trips.

- **Rate Limiting:** 100 requests per minute per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Performance:**
  - Indexed on \`relatedReview\` for efficient filtering.

- **Possible Errors:**
  - \`NOT_FOUND\`: Review with the provided \`reviewId\` does not exist OR invalid UUID format.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
