import { MutationOptions } from '@nestjs/graphql';

export const signOutAllDocs: MutationOptions = {
    name: 'signOutAll',
    description: `
Signs out the authenticated user from **all active sessions** across all devices.

- **Returns:** Boolean \`true\` indicating all sessions were successfully terminated.

- **Constraints:**
  - User must be authenticated with a valid session.
  - Re-authentication required: current password must be provided for security verification.

- **Side Effects:**
  - All user sessions are destroyed from the **Redis** session store.
  - Session cookie is cleared from the current client.
  - Security event is logged for audit trail.

- **Rate Limiting:** 3 requests per 20 minutes per user or IP address.

- **Authentication:** Required.

- **Roles Required:** Any role (\`REVIEWER\`, \`CREATOR\`, \`MODERATOR\`, \`ADMIN\`).

- **Account Status Required:** Any status (\`ACTIVE\`, \`PENDING_VERIFICATION\`, \`SUSPENDED\`).

- **Possible Errors:**
  - \`UNAUTHORIZED\`: Not authenticated or re-authentication password is incorrect.
  - \`TOO_MANY_REQUESTS\`: Rate limit exceeded.

- **Additional Notes:**
  - For remote sign-out without being logged in, use \`requestSignOutAll\` instead.
    `,
};
