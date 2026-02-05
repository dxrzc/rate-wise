import { MutationOptions } from '@nestjs/graphql';

export const signUpDocs: MutationOptions = {
    name: 'signUp',
    description: `
Creates a new user account with **PENDING_VERIFICATION** status.

- **Returns:** The created user account details.

- **Constraints:**
  - Email must be unique and in valid email format (max 254 characters).
  - Username must be unique, between 3-30 characters.
  - Password must be between 8-60 characters.

- **Side Effects:**
  - Username is trimmed (leading/trailing whitespace removed).
  - Password is securely hashed using **Argon2id**.
  - A server-side session is created and stored in **Redis** with configurable expiration.
  - Session cookie (\`connect.sid\`) is set with HttpOnly, Secure, and SameSite flags.
  - Default roles assigned: \`REVIEWER\` and \`CREATOR\`.
  - Account status set to \`PENDING_VERIFICATION\`.

- **Rate Limiting:** 3 requests per minute per IP.

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** N/A.

- **Additional Notes:**
  - The password field is never returned in responses.
  - To upgrade from \`PENDING_VERIFICATION\` to \`ACTIVE\` status, complete email verification via \`requestAccountVerification\`.
  - Active status is required to create items, write reviews, and vote.

- **Possible Errors:**
  - \`CONFLICT\`: Email or username already exists in the system.
  - \`BAD_REQUEST\`: Validation failed (invalid email format, password too short/long, username constraints).
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.
    `,
};
