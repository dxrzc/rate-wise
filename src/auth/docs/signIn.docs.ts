import { MutationOptions } from '@nestjs/graphql';

export const signInDocs: MutationOptions = {
    name: 'signIn',
    description: `
Authenticates a user with email and password credentials.

- **Returns:** Account details.

- **Constraints:**
  - Email must be provided and in valid format.
  - Password must match the stored hash.
  - User must not exceed the maximum concurrent sessions limit.

- **Side Effects:**  
  - A new server-side session is created and stored in **Redis**.
  - Session cookie (\`connect.sid\`) is set with HttpOnly, Secure, and SameSite flags.
  - Failed login attempts are logged for security monitoring.

- **Rate Limiting:** 3 requests per minute per IP. 

- **Authentication:** Not required.

- **Roles Required:** None.

- **Account Status Required:** Any status can sign in, but protected operations may be restricted based on status (e.g., \`SUSPENDED\` accounts have limited access).

- **Session Management:**
  - Maximum concurrent sessions are enforced (hard limit configured server-side).
  - Sessions are NOT automatically evicted — users must explicitly sign out.
  - Each session is stored in Redis with automatic expiration.

- **Security Features:**
  - Password length is validated before database lookup (early rejection of obviously invalid attempts).
  - Generic "Invalid credentials" message for both wrong email and wrong password (prevents user enumeration).
  - All authentication attempts are logged.

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Invalid credentials — email not found or password incorrect (same response prevents user enumeration).
  - \`FORBIDDEN\`: Maximum concurrent sessions reached. User must sign out from another session or sign out all sessions.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.   
    `,
};
