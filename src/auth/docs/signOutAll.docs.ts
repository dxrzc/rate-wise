import { MutationOptions } from '@nestjs/graphql';

export const signOutAllDocs: MutationOptions = {
    name: 'signOutAll',
    description: `
        Sign out the authenticated user from all active sessions across all devices.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** All roles allowed (USER, MODERATOR, ADMIN)
        
        **Account Status Required:** Any status (ACTIVE, PENDING_VERIFICATION, SUSPENDED)
        
        **Re-authentication:** Requires the user's password to be provided for security verification before terminating all sessions
        
        **Session:** Destroys all active user sessions on the server and clears the session cookie (connect.sid) from the current client. The user will be signed out from all devices and browsers and will need to sign in again.
        
        **Effect:** This is a security feature to revoke access from all devices. Useful if the user suspects their account has been compromised or wants to sign out from all locations remotely.
        
        **Rate Limiting:** Ultra-critical throttle applied to prevent abuse
        
        **Returns:** Boolean indicating success (true)
    `,
};
