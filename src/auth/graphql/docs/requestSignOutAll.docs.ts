import { MutationOptions } from '@nestjs/graphql';

export const requestSignOutAllDocs: MutationOptions = {
    name: 'requestSignOutAll',
    description: `
Sends a sign-out-all confirmation email to the provided address for **remote session termination**.

- **Returns:** A generic confirmation message: *"An email has been sent to your email address if it exists in our system."* (same response regardless of email existence to prevent user enumeration).

- **Constraints:**
  - Email must be provided.
  - If the email exists and account is not suspended, a sign-out email is queued.

- **Side Effects:**
  - If the email exists and account is \`ACTIVE\` or \`PENDING_VERIFICATION\`:
    - A cryptographically secure **JWT token** is generated.
    - Sign-out-all email is queued via **BullMQ** job queue.
    - Email contains a one-time link that terminates all sessions.
  - If email doesn't exist or account is \`SUSPENDED\`:
    - Operation silently completes (no email sent).
    - Same response returned (prevents user enumeration).
  - Upon clicking the link, all user sessions are destroyed from Redis.
  - Used tokens are blacklisted to prevent replay attacks.

- **Rate Limiting:** 3 requests per 20 minutes per user or IP address.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** \`ACTIVE\` or \`PENDING_VERIFICATION\` (for email to be sent). \`SUSPENDED\` accounts are silently ignored for security.

- **Security Features:**
  - **User enumeration prevention:** Same response for existing/non-existing emails.
  - **Suspended account protection:** Suspended accounts don't receive emails.
  - Allows users to revoke all sessions remotely without being logged in.

- **Additional Notes:**
  - This is the unauthenticated alternative to \`signOutAll\`.
  - Sign-out link expires after a configurable time period.
  - Each token can only be used once (JTI blacklisting).

- **Possible Errors:**
  - \`BAD_REQUEST\`: Invalid email format provided.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
