import { MutationOptions } from '@nestjs/graphql';

export const reactivateAccountDocs: MutationOptions = {
    name: 'reactivateAccount',
    description: `
Reactivates a previously suspended user account, restoring access to protected operations.

- **Returns:** Boolean true indicating the account was successfully reactivated.

- **Constraints:**
  - user_id: Must be a valid UUID referencing an existing user.
  - Target user cannot be an ADMIN (admins are protected from moderation changes).
  - Target user cannot be a MODERATOR (moderators are protected from moderation changes).
  - Target user must currently be SUSPENDED.

- **Side Effects:**
  - Target user's account status is changed to ACTIVE.
  - User cache entry is invalidated in Redis.
  - Reactivated users regain access to protected operations.

- **Rate Limiting:** 3 requests per minute per user or IP address.

- **Authentication:** Required — valid session cookie must be present.

- **Roles Required:** MODERATOR role only.

- **Account Status Required:** ACTIVE.

- **Security:**
  - Role hierarchy enforced: moderators cannot reactivate equal or higher roles.
  - All reactivation attempts are logged with moderator ID and target ID.

- **Possible Errors:**
  - UNAUTHORIZED: Not authenticated (no valid session).
  - FORBIDDEN: Caller lacks MODERATOR role or caller's account is not ACTIVE or target is ADMIN/MODERATOR.
  - NOT_FOUND: User with the provided ID does not exist or invalid UUID format.
  - CONFLICT: Target user is not suspended.
  - TOO_MANY_REQUESTS: Rate limit exceeded.
    `,
};
