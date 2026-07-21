import { QueryOptions } from '@nestjs/graphql';

export const findUserByUsernameDocs: QueryOptions = {
    name: 'findUserByUsername',
    description: `
Retrieves a user by their unique username.

- **Returns:** User details.

- **Constraints:**
  - The \`username\` must be a valid username (lowercase, 3-30 characters, alphanumeric and underscores only).
  - User must exist in the database.

- **Rate Limiting:** 100 requests per minute per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Performance:**
  - Lookup by unique username column ensures O(1) database performance.

- **Additional Notes:**
  - Use \`findUserById\` for lookup by UUID.
  - Use \`findAll\` for paginated user listing.

- **Possible Errors:**
  - \`NOT_FOUND\`: User with the provided username does not exist.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
