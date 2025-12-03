import { MutationOptions } from '@nestjs/graphql';

export const signOutDocs: MutationOptions = {
    name: 'signOut',
    description: `
        Sign out the authenticated user from the current session.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** All roles allowed (USER, MODERATOR, ADMIN)
        
        **Account Status Required:** Any status (ACTIVE, PENDING_VERIFICATION, SUSPENDED)
        
        **Session:** Destroys the current user session on the server and clears the session cookie (connect.sid) from the client. The user will need to sign in again to access protected endpoints.
        
        **Effect:** Only signs out from the current session. Other active sessions on different devices/browsers remain active. Use signOutAll to terminate all sessions.
        
        **Rate Limiting:** Critical throttle applied
        
        **Returns:** Boolean indicating success (true)
    `,
};
