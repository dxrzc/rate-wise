import { MutationOptions } from '@nestjs/graphql';

export const signOutDocs: MutationOptions = {
    name: 'signOut',
    description: `
Signs out the authenticated user from the current session.

- **Returns:** Boolean \`true\` indicating successful sign-out.

- **Constraints:**
  - User must be authenticated with a valid session.

- **Side Effects:**
  - Current session is destroyed from the **Redis** session store.
  - Session cookie is cleared from the client.
  - Sign-out event is logged for audit purposes.

- **Rate Limiting:** 3 requests per minute per user or IP address.

- **Authentication:** Required.

- **Roles Required:** Any role (\`REVIEWER\`, \`CREATOR\`, \`MODERATOR\`, \`ADMIN\`).

- **Account Status Required:** Any status (\`ACTIVE\`, \`PENDING_VERIFICATION\`, \`SUSPENDED\`).

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated (no valid session).
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.

- **Additional Notes:**
  - Use \`signOutAll\` to terminate all sessions.
    `,
};
