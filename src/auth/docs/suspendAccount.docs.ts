import { MutationOptions } from '@nestjs/graphql';

export const suspendAccountDocs: MutationOptions = {
    name: 'suspendAccount',
    description: `
        Suspend a user account, preventing them from accessing protected endpoints.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** Restricted to ADMIN and MODERATOR roles only
        
        **Account Status Required:** ACTIVE - the calling user must have an active account
        
        **Effect:** Changes the target user's account status to SUSPENDED, preventing them from accessing most endpoints. Suspended users can still sign in but will have limited access.
        
        **Restrictions:** ADMIN accounts cannot be suspended. This prevents accidental or malicious suspension of administrator accounts.
        
        **Rate Limiting:** Critical throttle applied
        
        **Returns:** Boolean indicating success (true)
    `,
};
