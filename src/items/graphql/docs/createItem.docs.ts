import { MutationOptions } from '@nestjs/graphql';

export const createItemDocs: MutationOptions = {
    name: 'createItem',
    description: `
Creates a new item (product/business/entity) to be rated and reviewed.

- **Returns:** The created item details.

- **Constraints:**
  - \`title\`: 5-40 characters (trimmed).
  - \`description\`: 5-500 characters (trimmed).
  - \`category\`: 3-40 characters (trimmed and lowercased for consistency).
  - \`tags\`: Optional array, max 10 tags, each 2-20 characters (trimmed and lowercased).
  - Title must be unique.

- **Side Effects:**
  - Title is trimmed (whitespace removal).
  - Description is trimmed.
  - Category is normalized: trimmed and converted to lowercase.
  - Tags array is normalized: each tag trimmed and lowercased, duplicates preserved.
  - Item is associated with the authenticated user as \`createdBy\`.

- **Rate Limiting:** 100 requests per minute per user or IP address.

- **Authentication:** Required.

- **Roles Required:** \`CREATOR\` role (assigned by default on sign-up).

- **Account Status Required:** \`ACTIVE\` only — email verification must be completed.

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated (no valid session).
  - \`FORBIDDEN\`: Account status is not \`ACTIVE\` or user lacks \`CREATOR\` role.
  - \`CONFLICT\`: Item with the same title already exists.
  - \`BAD_USER_INPUT\`: Validation failed (title/description/category length, tags array size).
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.

- **Additional Notes:**
  - Users cannot review their own items (enforced at review creation).
  - Items can be filtered by category, tag, or creator via the \`filterItems\` query.
  - Average rating is computed dynamically from associated reviews.
    `,
};
