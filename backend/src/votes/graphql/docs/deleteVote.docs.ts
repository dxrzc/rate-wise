import { MutationOptions } from '@nestjs/graphql';

export const deleteVoteDocs: MutationOptions = {
    name: 'deleteVote',
    description: `
Removes the authenticated user's vote from a review.

- **Returns:** Boolean — \`true\` if a vote was removed, \`false\` if no vote existed.

- **Constraints:**
  - \`reviewId\`: Must be a valid UUID referencing an existing review.

- **Side Effects:**
  - If user has voted on this review, the vote is deleted from the database.
  - Review's denormalized vote counters (\`upvotes\`/\`downvotes\`) are decremented atomically.
  - If no vote exists, operation completes successfully with \`false\` return.

- **Concurrency Control:**
  - Uses **pessimistic locking** (\`SELECT ... FOR UPDATE\`) on the user row.
  - All vote operations for the same user are serialized (prevents race conditions).
  - Entire operation runs within a **database transaction** for atomicity.
  - Prevents double-deletion or inconsistent counters during rapid operations.

- **Rate Limiting:** 1000 requests per minute per user or IP address.

- **Authentication:** Required.

- **Roles Required:** \`REVIEWER\` role (assigned by default on sign-up).

- **Account Status Required:** \`ACTIVE\` only — email verification must be completed.

- **Data Integrity:**
  - Vote counters updated within the same transaction as vote deletion.
  - A **scheduled cron job** (daily at midnight) reconciles counters as backup.
  - Transaction rollback ensures consistency if any step fails.

- **Possible Errors:**
  - \`UNAUTHORIZED\` — Not authenticated (no valid session).
  - \`FORBIDDEN\` — Account status is not \`ACTIVE\` or user lacks \`REVIEWER\` role.
  - \`NOT_FOUND\` — Review with the provided \`reviewId\` does not exist or invalid UUID format.
  - \`TOO_MANY_REQUESTS\` — Rate limit exceeded.
    `,
};
