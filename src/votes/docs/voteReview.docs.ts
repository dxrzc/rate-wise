import { MutationOptions } from '@nestjs/graphql';

export const voteReviewDocs: MutationOptions = {
    name: 'voteReview',
    description: `
Casts an upvote or downvote on a review.

- **Returns:** Boolean \`true\` indicating the vote was successfully recorded.

- **Constraints:**
  - \`vote\`: Must be either \`UP\` or \`DOWN\` (VoteAction enum).
  - \`reviewId\`: Must be a valid UUID referencing an existing review.

- **Side Effects:**
  - Vote is recorded in the database with \`createdBy\` (user) and \`relatedReview\` (review ID).
  - If user previously voted differently on this review, the old vote is removed first.
  - Review's denormalized vote counters (\`upvotes\`/\`downvotes\`) are updated atomically.
  - If user votes with the same action again, operation is **idempotent** (no change).

- **Concurrency Control:**
  - Uses **pessimistic locking** (\`SELECT ... FOR UPDATE\`) on the user row.
  - All vote operations for the same user are serialized (prevents race conditions).
  - Entire operation runs within a **database transaction** for atomicity.
  - Prevents duplicate votes or inconsistent counters during rapid voting.

- **Rate Limiting:** 1000 requests per minute per user or IP address.

- **Authentication:** Required — valid session cookie must be present.

- **Roles Required:** \`REVIEWER\` role (assigned by default on sign-up).

- **Account Status Required:** \`ACTIVE\` only — email verification must be completed.

- **Data Integrity:**
  - Vote counters are denormalized on the review for fast read performance.
  - A **scheduled cron job** (daily at midnight) reconciles counters with actual votes.
  - Transaction ensures atomic update of both vote record and counters.

- **Additional Notes:**
  - Use \`deleteVote\` to remove a vote entirely.

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated (no valid session).
  - \`FORBIDDEN\`: Account status is not \`ACTIVE\` OR user lacks \`REVIEWER\` role.
  - \`NOT_FOUND\`: Review with the provided \`reviewId\` does not exist or invalid UUID format.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};

export const voteReview = voteReviewDocs;
