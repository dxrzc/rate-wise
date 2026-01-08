import { MutationOptions } from '@nestjs/graphql';

export const requestAccountDeletionDocs: MutationOptions = {
    name: 'requestAccountDeletion',
    description: `
Sends an account deletion confirmation email to the authenticated user.

- **Returns:** Boolean \`true\` indicating the deletion confirmation email was successfully queued.

- **Constraints:**
  - User must be authenticated with a valid session.

- **Side Effects:**
  - A cryptographically secure **JWT token** is generated with the user's ID and a unique JTI.
  - Deletion confirmation email is queued via **BullMQ** job queue for reliable delivery.
  - Email contains a one-time deletion link that, when clicked, permanently deletes the account.
  - Upon clicking the link, the following cascade occurs:
    - User account is permanently deleted from the database.
    - All user sessions are destroyed from Redis.
    - Associated data (items, reviews, votes) is handled according to cascade rules.
  - Used tokens are blacklisted to prevent replay attacks.

- **Rate Limiting:** 3 requests per minute per user or IP address.

- **Authentication:** Required — valid session cookie must be present.

- **Roles Required:** Any role (\`REVIEWER\`, \`CREATOR\`, \`MODERATOR\`, \`ADMIN\`).

- **Account Status Required:** Any status (\`ACTIVE\`, \`PENDING_VERIFICATION\`, \`SUSPENDED\`).

- **Data Handling:**
  - Account deletion is performed within a **database transaction** for data integrity.
  - Related entities are handled via TypeORM cascade delete rules.
  - User cache entries are invalidated upon deletion.

- **Security Features:**
  - Two-step process: request email → confirm via link.
  - Each token can only be used once (JTI blacklisting).

- **Additional Notes:**
  - This action is **irreversible**. All user data will be permanently deleted.
  - The deletion link expires after a configurable time period.
  - Suspended accounts can also request deletion.

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated (no valid session).   
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded. 

    `,
};
