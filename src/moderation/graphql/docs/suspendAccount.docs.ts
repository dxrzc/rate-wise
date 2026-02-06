import { MutationOptions } from '@nestjs/graphql';

export const suspendAccountDocs: MutationOptions = {
    name: 'suspendAccount',
    description: `
Suspends a user account, restricting their access to protected operations.

- **Returns:** Boolean \`true\` indicating the account was successfully suspended.

- **Constraints:**
  - \`user_id\`: Must be a valid UUID referencing an existing user.
  - Target user cannot be an \`ADMIN\` (admins are protected from suspension).
  - Target user cannot be a \`MODERATOR\` (moderators are protected from suspension).
  - Target user cannot already be \`SUSPENDED\`.

- **Side Effects:**
  - Target user's account status is changed to \`SUSPENDED\`.
  - User cache entry is invalidated in **Redis**.  
  - Suspended users can still sign in but cannot perform protected operations.

- **Rate Limiting:** 3 requests per minute per user or IP address.

- **Authentication:** Required — valid session cookie must be present.

- **Roles Required:** \`MODERATOR\` role only.

- **Account Status Required:** \`ACTIVE\`.

- **Suspension Effects:**
  - Suspended users can sign in.
  - Suspended users cannot: create items, write reviews, vote, request verification.
  - Suspended users CAN: sign out, request account deletion.

- **Security:**
  - Role hierarchy enforced: moderators cannot suspend equal or higher roles.
  - All suspension attempts are logged with moderator ID and target ID.

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated (no valid session).
  - \`FORBIDDEN\`: Caller lacks \`MODERATOR\` role or caller's account is not \`ACTIVE\` or target is \`ADMIN\`/\`MODERATOR\`.
  - \`NOT_FOUND\`: User with the provided ID does not exist or invalid UUID format.
  - \`CONFLICT\`: Target user is already suspended.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
