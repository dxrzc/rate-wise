import { MutationOptions } from '@nestjs/graphql';

export const createReviewDocs: MutationOptions = {
    name: 'createReview',
    description: `
Creates a new review for an item with a rating and text content.

- **Returns:** The created review details.

- **Constraints:**
  - \`content\`: 10-2000 characters (trimmed).
  - \`rating\`: Integer between 0-10 (inclusive).
  - \`itemId\`: Must be a valid UUID referencing an existing item.
  - Users cannot review their own items (self-review prevention).
  - One review per user per item (enforced by unique constraint in the database).

- **Side Effects:**
  - Content is trimmed (whitespace removal).
  - Review is associated with the authenticated user as \`createdBy\`.
  - Review is linked to the specified item as \`relatedItem\`.
  - Initial vote counts set to 0.

- **Rate Limiting:** 1000 requests per minute per user or IP address.

- **Authentication:** Required.

- **Roles Required:** \`REVIEWER\` role (assigned by default on sign-up).

- **Account Status Required:** \`ACTIVE\` only — email verification must be completed.

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated (no valid session).
  - \`FORBIDDEN\`: Account status is not \`ACTIVE\` OR user lacks \`REVIEWER\` role OR user is trying to review their own item.
  - \`NOT_FOUND\`: Item with the provided \`itemId\` does not exist OR invalid UUID format.
  - \`CONFLICT\`: User has already reviewed this item.
  - \`BAD_USER_INPUT\`: Validation failed (content length, rating range, missing fields).
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.

- **Business Rules:**
  - Self-review prevention: creators cannot review their own items to prevent rating manipulation.
  - One review per user per item: enforced via database unique constraint on \`(createdBy, relatedItem)\`.

- **Data Integrity:**
  - Reviews use denormalized vote counters (\`upvotes\`, \`downvotes\`) for query performance.
  - Vote counts are periodically synchronized via a **scheduled cron job**.

- **Additional Notes:**  
  - Item's average rating is computed in real-time from all reviews when queried.
    `,
};
