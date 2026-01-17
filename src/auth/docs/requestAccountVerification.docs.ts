import { MutationOptions } from '@nestjs/graphql';

export const requestAccountVerificationDocs: MutationOptions = {
    name: 'requestAccountVerification',
    description: `
Sends an account verification email to the authenticated user's email address.

- **Returns:** Boolean \`true\` indicating the verification email was successfully queued.

- **Constraints:**
  - User must be authenticated.
  - Account status must be \`PENDING_VERIFICATION\` (already verified accounts cannot request verification).

- **Side Effects:**
  - A cryptographically secure **JWT token** is generated with the user's ID and a unique JTI (JWT ID).
  - Verification email is queued via **BullMQ** job queue for reliable delivery.
  - Email contains a one-time verification link that, when clicked, activates the account.
  - Upon successful verification, account status changes from \`PENDING_VERIFICATION\` to \`ACTIVE\`.
  - Used tokens are blacklisted to prevent replay attacks.

- **Rate Limiting:** 3 requests per 20 minutes per user per IP address.

- **Authentication:** Required.

- **Roles Required:** Any role (\`REVIEWER\`, \`CREATOR\`, \`MODERATOR\`, \`ADMIN\`).

- **Account Status Required:** \`PENDING_VERIFICATION\` only.

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated (no valid session).
  - \`CONFLICT\`: Account is already verified (\`ACTIVE\` status).
  - \`FORBIDDEN\`: Account is \`SUSPENDED\` (not allowed to request verification).
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.

- **Additional Notes:**
  - Verification link expires after a configurable time period.
  - Each token can only be used once (JTI blacklisting).
  - Active account status unlocks full platform features: creating items, writing reviews, and voting.
    `,
};
